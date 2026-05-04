'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe,
  Sparkles,
  Bot,
  ListChecks,
  Brain,
  Rocket,
  Shield,
  ShoppingCart,
  Activity,
  Code,
  Gauge,
  Cpu,
  Search,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Layers,
  Database,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { API_URL } from '@/lib/config';

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

interface GuideSubsection {
  id: string;
  title: string;
  description: string;
}

interface GuideSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  subsections: GuideSubsection[];
  liveData?: Record<string, unknown>;
  generatedContent?: string;
}

interface DoctrineStage {
  stage: number | string;
  name: string;
  domain: string;
}

interface SearchResult {
  sectionId: string;
  sectionTitle: string;
  subsectionId?: string;
  subsectionTitle?: string;
  matchType: string;
  matchText: string;
  relevance: number;
}

interface GuideData {
  sections: GuideSection[];
  doctrine: {
    totalStages: number;
    domains: Record<string, string>;
    stagesByDomain: Record<string, DoctrineStage[]>;
  };
  meta: {
    totalSections: number;
    totalSubsections: number;
    hasGeneratedContent: boolean;
    timestamp: string;
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Icon Map
   ═══════════════════════════════════════════════════════════════════════════ */

const ICON_MAP: Record<string, LucideIcon> = {
  Globe,
  Sparkles,
  Bot,
  ListChecks,
  Brain,
  Rocket,
  Shield,
  ShoppingCart,
  Activity,
  Code,
  Gauge,
  Cpu,
  Layers,
  Database,
  Zap,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || BookOpen;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('memelli_token');
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tooltip definitions for technical terms
   ═══════════════════════════════════════════════════════════════════════════ */

const TERM_TOOLTIPS: Record<string, string> = {
  'doctrine': 'The complete set of system laws governing how the OS operates',
  'agent pool': 'A group of specialized AI agents that handle specific task types',
  'Claude lane': 'An API connection channel to Anthropic Claude for AI processing',
  'patrol grid': 'Continuous monitoring system scanning all subsystems for issues',
  'task grid': 'Distributed execution engine managing parallel task processing',
  'sensor grid': 'Network of sensors monitoring system health and performance',
  'BullMQ': 'Redis-based queue system for distributing background jobs',
  'tenant': 'An isolated workspace/organization within the platform',
  'Melli': 'The AI controller powered by Claude that governs all system operations',
  'UniScreen': 'Multi-context tabbed workspace system for the dashboard',
  'MUA': 'Master Universe Assistant - the central AI orchestration brain',
};

/* ═══════════════════════════════════════════════════════════════════════════
   Hooks
   ═══════════════════════════════════════════════════════════════════════════ */

function useIntersectionFade() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, isVisible };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════ */

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-block cursor-help border-b border-dotted border-[hsl(var(--border))]"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <span
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[11px] text-[hsl(var(--foreground))] whitespace-nowrap z-50 pointer-events-none transition-all duration-200 ${
          show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
      >
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-zinc-800" />
      </span>
    </span>
  );
}

function enrichDescription(text: string): React.ReactNode {
  const terms = Object.keys(TERM_TOOLTIPS);
  const regex = new RegExp(`\\b(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) => {
    const lower = part.toLowerCase();
    const tooltip = TERM_TOOLTIPS[lower];
    if (tooltip) {
      return <Tooltip key={i} text={tooltip}>{part}</Tooltip>;
    }
    return part;
  });
}

function ArchitectureDiagram() {
  return (
    <div className="relative rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div className="relative text-center mb-6">
        <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-[0.2em]">System Architecture</span>
      </div>

      {/* Top: Melli */}
      <div className="relative flex justify-center mb-4">
        <div className="flex items-center gap-2 rounded-xl bg-red-600/10 border border-red-500/20 px-4 py-2.5">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[12px] font-semibold text-red-300">Melli CPU</span>
        </div>
      </div>

      {/* Line down */}
      <div className="flex justify-center mb-4">
        <div className="w-px h-6 bg-gradient-to-b from-red-500/30 to-red-500/10" />
      </div>

      {/* Middle: Managers row */}
      <div className="flex justify-center gap-3 mb-4 flex-wrap">
        {['MUA', 'Task Grid', 'Agent Factory', 'Patrol Grid'].map((name) => (
          <div key={name} className="flex items-center gap-1.5 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-3 py-1.5 text-[11px] text-[hsl(var(--muted-foreground))]">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
            {name}
          </div>
        ))}
      </div>

      {/* Spread lines */}
      <div className="flex justify-center mb-4">
        <div className="relative w-full max-w-md h-4">
          <div className="absolute left-1/2 top-0 w-px h-2 bg-[hsl(var(--muted))] -translate-x-1/2" />
          <div className="absolute left-[15%] right-[15%] top-2 h-px bg-gradient-to-r from-white/[0.02] via-white/[0.08] to-white/[0.02]" />
          {[15, 38, 62, 85].map((p) => (
            <div key={p} className="absolute top-2 w-px h-2 bg-[hsl(var(--muted))]" style={{ left: `${p}%` }} />
          ))}
        </div>
      </div>

      {/* Bottom: 4 Engines */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { name: 'Commerce', color: 'text-emerald-400 border-emerald-500/15' },
          { name: 'CRM', color: 'text-blue-400 border-blue-500/15' },
          { name: 'Coaching', color: 'text-amber-400 border-amber-500/15' },
          { name: 'SEO', color: 'text-red-400 border-red-500/15' },
        ].map((engine) => (
          <div key={engine.name} className={`rounded-lg border bg-[hsl(var(--muted))] px-2 py-1.5 text-center text-[10px] font-medium ${engine.color}`}>
            {engine.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadProgressBar({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      if (scrollHeight <= 0) { setProgress(100); return; }
      setProgress(Math.min(100, Math.round((scrollTop / scrollHeight) * 100)));
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, [containerRef]);

  return (
    <div className="absolute top-0 left-0 right-0 h-0.5 bg-[hsl(var(--muted))] z-10">
      <div
        className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function CollapsibleSubsection({ sub, index }: { sub: GuideSubsection; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { ref, isVisible } = useIntersectionFade();

  return (
    <div
      ref={ref}
      className={`transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full rounded-xl border bg-[hsl(var(--muted))] p-4 text-left transition-all duration-200 group ${
          expanded ? 'border-red-500/20 bg-red-600/[0.03]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--border))]'
        }`}
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            className={`h-4 w-4 text-red-400/60 transition-transform duration-200 ${
              expanded ? 'rotate-90' : ''
            }`}
          />
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors duration-200">
            {sub.title}
          </h3>
        </div>
        <div
          className={`overflow-hidden transition-all duration-250 ease-out ${
            expanded ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
          }`}
        >
          <p className="text-[13px] text-[hsl(var(--muted-foreground))] leading-relaxed pl-6">
            {enrichDescription(sub.description)}
          </p>
        </div>
      </button>
    </div>
  );
}

function FloatingTOC({
  sections,
  activeSection,
  onSelect,
}: {
  sections: GuideSection[];
  activeSection: string;
  onSelect: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const activeIdx = sections.findIndex((s) => s.id === activeSection);
  const progress = sections.length > 0 ? Math.round(((activeIdx + 1) / sections.length) * 100) : 0;

  return (
    <div className={`fixed right-6 top-1/2 -translate-y-1/2 z-40 transition-all duration-250 ${collapsed ? 'w-8' : 'w-48'}`}>
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-2xl shadow-black/30 overflow-hidden">
        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-3 py-2 text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors duration-200"
        >
          {!collapsed && <span className="uppercase tracking-wider font-semibold">Contents</span>}
          <BookOpen className="h-3 w-3 shrink-0" />
        </button>

        {!collapsed && (
          <>
            {/* Progress ring */}
            <div className="px-3 pb-2 flex items-center gap-2">
              <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                <circle
                  cx="10" cy="10" r="8" fill="none" stroke="#E11D2E" strokeWidth="2"
                  strokeDasharray={`${progress * 0.5} 50`}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{progress}% read</span>
            </div>

            {/* Section list */}
            <div className="max-h-72 overflow-y-auto px-1.5 pb-2 space-y-0.5">
              {sections.map((s) => {
                const isActive = s.id === activeSection;
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelect(s.id)}
                    className={`w-full text-left px-2 py-1 rounded-lg text-[10px] truncate transition-all duration-200 ${
                      isActive
                        ? 'bg-red-600/10 text-red-300 font-medium'
                        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
                    }`}
                  >
                    {s.title}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Page Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function SystemGuidePage() {
  const [guideData, setGuideData] = useState<GuideData | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchAnimating, setSearchAnimating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Fetch guide data ──────────────────────────────────────────────────
  const fetchGuide = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/system-guide`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Failed to load guide: ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setGuideData(json.data);
      } else {
        throw new Error(json.error || 'Unknown error');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load guide');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuide();
  }, [fetchGuide]);

  // ── Search ────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/system-guide/search?q=${encodeURIComponent(q)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        setSearchAnimating(true);
        setSearchResults(json.data.results || []);
        setTimeout(() => setSearchAnimating(false), 400);
      }
    } catch {
      // Silently fail search
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // ── Generate guide ────────────────────────────────────────────────────
  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setGenerateMessage(null);
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/system-guide/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json.success) {
        setGenerateMessage(json.data.message);
        await fetchGuide();
      } else {
        setGenerateMessage(`Error: ${json.error}`);
      }
    } catch (err: unknown) {
      setGenerateMessage(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Active section data ───────────────────────────────────────────────
  const currentSection = guideData?.sections.find((s) => s.id === activeSection);

  /* ═══════════════════════════════════════════════════════════════════════
     Loading State
     ═══════════════════════════════════════════════════════════════════════ */

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            <BookOpen className="absolute inset-0 m-auto h-4 w-4 text-red-400 animate-pulse" />
          </div>
          <p className="text-[13px] text-[hsl(var(--muted-foreground))] animate-pulse">Loading System Guide...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center max-w-md">
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <button
            onClick={fetchGuide}
            className="px-4 py-2 bg-red-600/20 text-red-300 rounded-xl text-sm hover:bg-red-600/30 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Floating TOC */}
      {guideData && (
        <FloatingTOC
          sections={guideData.sections}
          activeSection={activeSection}
          onSelect={setActiveSection}
        />
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600/15 group">
            <BookOpen className="h-5 w-5 text-red-400 transition-transform duration-200 group-hover:scale-110" />
            <div className="absolute inset-0 rounded-2xl bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">System Guide</h1>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
              {guideData?.meta.totalSections} sections &middot; {guideData?.meta.totalSubsections} topics &middot; {guideData?.doctrine.totalStages} doctrine stages
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchGuide}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] text-[12px] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-200 group"
          >
            <RefreshCw className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-90" />
            Refresh
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 text-red-300 text-[12px] font-medium hover:bg-red-600/30 transition-all duration-200 disabled:opacity-50 group"
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Guide'}
          </button>
        </div>
      </div>

      {/* ── Generate message ────────────────────────────────────────────── */}
      {generateMessage && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 animate-in-slide-down">
          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
          <p className="text-[12px] text-green-300">{generateMessage}</p>
        </div>
      )}

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))] transition-colors duration-200" />
        <input
          type="text"
          placeholder="Search guide... (agents, deployment, security, etc.)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:border-red-500/30 focus:bg-[hsl(var(--muted))] focus:shadow-[0_0_0_3px_rgba(225,29,46,0.08)] transition-all duration-200"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))] animate-spin" />
        )}
      </div>

      {/* ── Search results (animated) ────────────────────────────────────── */}
      {searchResults.length > 0 && searchQuery.trim().length >= 2 && (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 space-y-1.5 max-h-60 overflow-y-auto">
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </p>
          {searchResults.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveSection(r.sectionId);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className={`w-full text-left flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-all duration-200 group ${
                searchAnimating ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'
              }`}
              style={{
                transitionDelay: searchAnimating ? '0ms' : `${i * 50}ms`,
                animation: searchAnimating ? 'none' : `slideInRight 250ms ${i * 50}ms both`,
              }}
            >
              <ChevronRight className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] mt-0.5 group-hover:text-red-400 transition-all duration-200 group-hover:translate-x-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-[hsl(var(--foreground))]">{r.sectionTitle}</span>
                  {r.subsectionTitle && (
                    <>
                      <ChevronRight className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
                      <span className="text-[12px] text-[hsl(var(--muted-foreground))]">{r.subsectionTitle}</span>
                    </>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                    {r.matchType}
                  </span>
                </div>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5 truncate">{r.matchText}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Main content area ───────────────────────────────────────────── */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* ── Left sidebar: section nav ──────────────────────────────────── */}
        <div className="w-64 shrink-0 overflow-y-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-2 space-y-0.5">
          {guideData?.sections.map((section, sIdx) => {
            const Icon = getIcon(section.icon);
            const isActive = section.id === activeSection;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                  isActive
                    ? 'bg-red-600/10 text-red-300 border border-red-500/20 shadow-[0_0_12px_rgba(225,29,46,0.06)]'
                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] border border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-all duration-200 ${
                  isActive ? 'text-red-400' : 'group-hover:scale-110'
                }`} />
                <span className="text-[13px] font-medium truncate">{section.title}</span>
                {section.liveData && Object.keys(section.liveData).length > 0 && (
                  <span className="ml-auto relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 animate-ping opacity-50" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                  </span>
                )}
              </button>
            );
          })}

          {/* Doctrine stages summary */}
          <div className="mt-4 pt-3 border-t border-[hsl(var(--border))]">
            <p className="px-3 text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">Doctrine</p>
            <div className="px-3 space-y-1">
              {guideData?.doctrine && Object.entries(guideData.doctrine.domains).map(([key, label]) => {
                const stageCount = guideData.doctrine.stagesByDomain[key]?.length || 0;
                if (stageCount === 0) return null;
                return (
                  <div key={key} className="flex items-center justify-between text-[11px] group">
                    <span className="text-[hsl(var(--muted-foreground))] truncate group-hover:text-[hsl(var(--muted-foreground))] transition-colors duration-200">{label as string}</span>
                    <span className="text-[hsl(var(--muted-foreground))] tabular-nums group-hover:text-[hsl(var(--muted-foreground))] transition-colors duration-200">{stageCount}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Main content panel ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] relative" ref={contentRef}>
          <ReadProgressBar containerRef={contentRef} />
          <div className="p-6">
            {currentSection ? (
              <div className="space-y-6" key={currentSection.id} style={{ animation: 'fadeInUp 300ms ease-out both' }}>
                {/* Section header */}
                <div className="flex items-start gap-4">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/10 shrink-0 group">
                    {(() => {
                      const Icon = getIcon(currentSection.icon);
                      return <Icon className="h-6 w-6 text-red-400 transition-transform duration-200 group-hover:scale-110" />;
                    })()}
                    <div className="absolute inset-0 rounded-2xl border border-red-500/0 group-hover:border-red-500/20 transition-all duration-200" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">{currentSection.title}</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{enrichDescription(currentSection.description)}</p>
                  </div>
                </div>

                {/* Architecture diagram (show on overview) */}
                {currentSection.id === 'overview' && <ArchitectureDiagram />}

                {/* Live data cards */}
                {currentSection.liveData && Object.keys(currentSection.liveData).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.entries(currentSection.liveData).map(([key, value], i) => {
                      if (typeof value === 'object' && value !== null && !Array.isArray(value)) return null;
                      return (
                        <div
                          key={key}
                          className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-all duration-200 group"
                          style={{ animation: `fadeInUp 300ms ${i * 50}ms both` }}
                        >
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider group-hover:text-[hsl(var(--muted-foreground))] transition-colors duration-200">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                          </p>
                          <p className="text-lg font-semibold text-[hsl(var(--foreground))] mt-1 tabular-nums">
                            {Array.isArray(value) ? value.length : String(value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Subsections (collapsible with animations) */}
                <div className="space-y-2">
                  {currentSection.subsections.map((sub, i) => (
                    <CollapsibleSubsection key={sub.id} sub={sub} index={i} />
                  ))}
                </div>

                {/* Generated content (if available) */}
                {currentSection.generatedContent && (
                  <div className="mt-6 pt-6 border-t border-[hsl(var(--border))]" style={{ animation: 'fadeInUp 400ms 200ms both' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-red-400" />
                      <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">AI-Generated Content</h3>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-[12px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded-xl p-4 border border-[hsl(var(--border))] leading-relaxed font-sans">
                        {currentSection.generatedContent}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Related doctrine stages */}
                {guideData?.doctrine && (
                  <div className="mt-6 pt-6 border-t border-[hsl(var(--border))]" style={{ animation: 'fadeInUp 400ms 300ms both' }}>
                    <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] mb-3 flex items-center gap-2">
                      <Database className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      Related Doctrine Stages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {ALL_RELATED_STAGES(currentSection.id, guideData.doctrine.stagesByDomain).map((stage, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[11px] text-[hsl(var(--muted-foreground))] hover:border-red-500/20 hover:bg-red-600/[0.03] hover:text-[hsl(var(--muted-foreground))] transition-all duration-200 cursor-default"
                          style={{ animation: `fadeInUp 200ms ${i * 30}ms both` }}
                        >
                          <span className="text-red-400/60 font-mono">S{stage.stage}</span>
                          {stage.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[hsl(var(--muted-foreground))] text-sm">
                Select a section to view
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

const SECTION_DOMAIN_MAP: Record<string, string[]> = {
  overview: ['cpu', 'data'],
  jessica: ['interface', 'communication'],
  agents: ['agents', 'labor'],
  tasks: ['operations', 'execution'],
  memory: ['intelligence'],
  deployment: ['infrastructure'],
  security: ['security'],
  commercial: ['commercial', 'customers'],
  monitoring: ['monitoring', 'governance'],
  api: ['operations'],
  speed: ['operations'],
  lanes: ['intelligence'],
};

function ALL_RELATED_STAGES(
  sectionId: string,
  stagesByDomain: Record<string, DoctrineStage[]>,
): DoctrineStage[] {
  const domains = SECTION_DOMAIN_MAP[sectionId] || [];
  const stages: DoctrineStage[] = [];
  for (const domain of domains) {
    if (stagesByDomain[domain]) {
      stages.push(...stagesByDomain[domain]);
    }
  }
  return stages;
}
