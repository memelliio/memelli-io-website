'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  User,
  Briefcase,
  ClipboardList,
  GitBranch,
  Package,
  FileText,
  CheckSquare,
  Bell,
  BookOpen,
  Brain,
  Command,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { API_URL } from '@/lib/config';
import { useWorkspaceTabStore } from '@/stores/workspace-store';
import type { TabType } from '@/stores/workspace-store';

// ── Types ──────────────────────────────────────────────────────────────

interface SearchResult {
  resultId: string;
  resultType: string;
  displayTitle: string;
  subtitle?: string;
  entityType?: string;
  entityId?: string;
  commandRef?: string;
  summaryPayload?: Record<string, unknown>;
  workspaceTarget?: string;
  relevanceScore: number;
  icon?: string;
  statusBadge?: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  queryTime: number;
  suggestions?: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const TYPE_LABELS: Record<string, string> = {
  contact: 'CONTACTS',
  deal: 'DEALS',
  work_order: 'WORK ORDERS',
  pipeline: 'PIPELINES',
  product: 'PRODUCTS',
  article: 'ARTICLES',
  task: 'TASKS',
  notification: 'NOTIFICATIONS',
  program: 'PROGRAMS',
  ai_session: 'AI SESSIONS',
  command: 'COMMANDS',
};

const ICON_MAP: Record<string, typeof Search> = {
  user: User,
  briefcase: Briefcase,
  'clipboard-list': ClipboardList,
  'git-branch': GitBranch,
  package: Package,
  'file-text': FileText,
  'check-square': CheckSquare,
  bell: Bell,
  'book-open': BookOpen,
  brain: Brain,
  command: Command,
  contact: User,
  'trending-up': TrendingUp,
};

const TYPE_ICONS: Record<string, typeof Search> = {
  contact: User,
  deal: Briefcase,
  work_order: ClipboardList,
  pipeline: GitBranch,
  product: Package,
  article: FileText,
  task: CheckSquare,
  notification: Bell,
  program: BookOpen,
  ai_session: Brain,
  command: Command,
};

const TYPE_TO_TAB: Record<string, TabType> = {
  contact: 'contacts',
  deal: 'deals',
  work_order: 'custom',
  pipeline: 'crm',
  product: 'products',
  article: 'seo',
  task: 'activities',
  notification: 'notifications',
  program: 'coaching',
  ai_session: 'ai',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  COMPLETED: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
  PENDING: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
  FAILED: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
  IN_PROGRESS: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
  DRAFT: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
  CANCELLED: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
  ESCALATED: 'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20',
  unread: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
  read: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
};

function groupResults(results: SearchResult[]): { group: string; type: string; items: SearchResult[] }[] {
  const groups: Record<string, SearchResult[]> = {};
  for (const r of results) {
    if (!groups[r.resultType]) groups[r.resultType] = [];
    groups[r.resultType].push(r);
  }
  return Object.entries(groups).map(([type, items]) => ({
    group: TYPE_LABELS[type] ?? type.toUpperCase(),
    type,
    items,
  }));
}

function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
}

// ── Component ──────────────────────────────────────────────────────────

export function GlobalSearch() {
  const router = useRouter();
  const openOrFocusTab = useWorkspaceTabStore((s) => s.openOrFocusTab);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showRecent, setShowRecent] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Flat list of all selectable items (results + recent when visible)
  const flatResults = results;
  const flatRecent = recentSearches;

  // ── Fetch recent searches ──────────────────────────────────────────

  const fetchRecent = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/search/recent?limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setRecentSearches(json.data?.searches ?? []);
      }
    } catch {
      // non-critical
    }
  }, []);

  // ── Search API call ────────────────────────────────────────────────

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(
        `${API_URL}/api/admin/search?q=${encodeURIComponent(q)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        },
      );
      if (!res.ok) {
        setResults([]);
        setIsOpen(true);
        return;
      }
      const json = await res.json();
      const data: SearchResponse = json.data ?? json;
      setResults(data.results ?? []);
      setSuggestions(data.suggestions ?? []);
      setIsOpen(true);
      setShowRecent(false);
    } catch {
      setResults([]);
      setIsOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Debounced search trigger ───────────────────────────────────────

  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
      setSuggestions([]);
    }
  }, [debouncedQuery, performSearch]);

  // ── Close on outside click ─────────────────────────────────────────

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowRecent(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Keyboard shortcut: Cmd+K / Ctrl+K ─────────────────────────────

  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // ── Navigation ─────────────────────────────────────────────────────

  function navigateToResult(result: SearchResult) {
    setIsOpen(false);
    setShowRecent(false);
    setQuery('');

    // Command results: execute via action engine pattern
    if (result.resultType === 'command' && result.commandRef) {
      // For commands, fill the query with the command pattern for the user
      // They can use the sphere/action engine to execute
      setQuery(result.subtitle ?? result.displayTitle);
      inputRef.current?.focus();
      return;
    }

    // Entity results: open in UniScreen tab
    if (result.workspaceTarget) {
      const tabType = TYPE_TO_TAB[result.resultType] ?? 'custom';
      openOrFocusTab({
        type: tabType,
        title: result.displayTitle,
        icon: result.icon,
        entityId: result.entityId,
        entityType: result.entityType,
        route: result.workspaceTarget,
        source: 'user',
      });
      router.push(result.workspaceTarget);
    }
  }

  function handleRecentClick(searchQuery: string) {
    setQuery(searchQuery);
    setShowRecent(false);
    setActiveIndex(-1);
  }

  function handleSuggestionClick(suggestion: string) {
    setQuery(suggestion);
    setActiveIndex(-1);
  }

  // ── Keyboard navigation ────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setShowRecent(false);
      setQuery('');
      inputRef.current?.blur();
      return;
    }

    // Handle recent searches navigation
    if (showRecent && flatRecent.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatRecent.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        handleRecentClick(flatRecent[activeIndex]);
      }
      return;
    }

    // Handle search results navigation
    if (!isOpen || flatResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      navigateToResult(flatResults[activeIndex]);
    }
  }

  // ── Focus handler ──────────────────────────────────────────────────

  function handleFocus() {
    if (query.trim()) {
      if (results.length > 0) setIsOpen(true);
    } else {
      fetchRecent();
      setShowRecent(true);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────

  const groups = groupResults(results);
  let globalIdx = -1;

  return (
    <div ref={containerRef} className="relative w-72">
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))] pointer-events-none transition-colors duration-200 group-focus-within:text-[hsl(var(--foreground))]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
            if (!e.target.value.trim()) {
              setShowRecent(true);
              setIsOpen(false);
            } else {
              setShowRecent(false);
            }
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2 pl-10 pr-16 text-[13px] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none backdrop-blur-sm focus:border-red-500/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-red-500/20 transition-all duration-300"
        />
        {loading && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-[hsl(var(--border))] border-t-red-400" />
        )}
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded-lg bg-[hsl(var(--muted))] px-1.5 py-0.5 text-xs text-[hsl(var(--muted-foreground))] font-mono">
          <span className="text-[10px]">&#8984;</span>K
        </kbd>
      </div>

      {/* Recent searches dropdown */}
      {showRecent && !query.trim() && recentSearches.length > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 mt-2 w-[420px] rounded-2xl border border-white/[0.06] bg-[hsl(var(--card))] backdrop-blur-3xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Recent Searches
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto px-2 pb-2">
            {recentSearches.map((term, i) => {
              const isActive = activeIndex === i;
              return (
                <button
                  key={`recent-${i}`}
                  onClick={() => handleRecentClick(term)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left rounded-xl transition-all duration-150 ${
                    isActive ? 'bg-red-500/10 text-[hsl(var(--foreground))]' : 'hover:bg-white/[0.04] text-[hsl(var(--foreground))]'
                  }`}
                >
                  <Clock className={`h-4 w-4 shrink-0 transition-colors duration-150 ${isActive ? 'text-red-400' : 'text-[hsl(var(--muted-foreground))]'}`} />
                  <span className="truncate text-[13px]">{term}</span>
                  <ArrowRight className={`ml-auto h-3.5 w-3.5 transition-all duration-150 ${isActive ? 'text-red-400 translate-x-0 opacity-100' : 'text-[hsl(var(--muted-foreground))] -translate-x-1 opacity-0'}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search results dropdown */}
      {isOpen && !showRecent && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 mt-2 w-[480px] rounded-2xl border border-white/[0.06] bg-[hsl(var(--card))] backdrop-blur-3xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
          {results.length === 0 && !loading ? (
            <div className="py-14 text-center">
              <Search className="mx-auto h-8 w-8 text-[hsl(var(--muted-foreground))] mb-3" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                No results for &ldquo;{query}&rdquo;
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Try a different search term</p>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto py-2">
              {groups.map(({ group, type, items }) => (
                <div key={group} className="mb-1">
                  <div className="px-5 pt-3 pb-1.5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      {group}
                    </p>
                  </div>
                  <div className="px-2">
                    {items.map((item) => {
                      globalIdx += 1;
                      const idx = globalIdx;
                      const IconComponent =
                        (item.icon ? ICON_MAP[item.icon] : null) ??
                        TYPE_ICONS[item.resultType] ??
                        Search;
                      const isActive = activeIndex === idx;
                      const statusColor =
                        item.statusBadge ? STATUS_COLORS[item.statusBadge] ?? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]' : null;

                      return (
                        <button
                          key={item.resultId}
                          onClick={() => navigateToResult(item)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex w-full items-center gap-3.5 px-3 py-2.5 text-left rounded-xl transition-all duration-150 ${
                            isActive ? 'bg-red-500/10' : 'hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
                            isActive ? 'bg-red-500/15 text-red-400' : 'bg-white/[0.04] text-[hsl(var(--muted-foreground))]'
                          }`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`truncate text-[13px] font-medium transition-colors duration-150 ${
                                isActive ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--foreground))]'
                              }`}>
                                {item.displayTitle}
                              </p>
                              {statusColor && item.statusBadge && (
                                <span
                                  className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusColor}`}
                                >
                                  {item.statusBadge}
                                </span>
                              )}
                            </div>
                            {item.subtitle && (
                              <p className="truncate text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                          <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors duration-150 ${
                            isActive ? 'bg-red-500/10 text-red-400' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                          }`}>
                            {TYPE_LABELS[item.resultType]?.split(' ')[0] ?? item.resultType}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mx-3 mt-2 pt-2 border-t border-white/[0.04]">
                  <div className="px-2 pt-1 pb-1.5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Suggestions
                    </p>
                  </div>
                  {suggestions.map((s, i) => (
                    <button
                      key={`sug-${i}`}
                      onClick={() => handleSuggestionClick(s)}
                      className="flex w-full items-center gap-3 px-2 py-2 text-left rounded-xl hover:bg-white/[0.04] transition-all duration-150"
                    >
                      <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))]" />
                      <span className="truncate text-xs text-[hsl(var(--muted-foreground))]">{s}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer with query time */}
          {results.length > 0 && (
            <div className="border-t border-white/[0.04] px-5 py-2.5 flex justify-between items-center">
              <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{results.length} results</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <kbd className="rounded-lg bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))] font-mono">&#8593;&#8595;</kbd>
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))]">navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="rounded-lg bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))] font-mono">&#8629;</kbd>
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))]">open</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="rounded-lg bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))] font-mono">esc</kbd>
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))]">close</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
