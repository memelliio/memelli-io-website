'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../../../hooks/useApi';
import { LoadingGlobe } from '@/components/ui/loading-globe';
import {
  Shield,
  Globe,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  ExternalLink,
  Settings,
  Wrench,
  MessageSquare,
  ShoppingBag,
  FileText,
  Map,
  Bot,
  Tag,
  BarChart3,
  Search
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SiteType = 'MARKETING' | 'AUTHORITY' | 'STORE' | 'BLOG' | 'PORTAL' | 'LANDING';
type CompatibilityLevel = 'full' | 'partial' | 'incompatible';
type StatusLevel = 'complete' | 'partial' | 'missing';

interface RequiredPage {
  path: string;
  present: boolean;
}

interface SiteAudit {
  id: string;
  name: string;
  domain: string;
  siteType: SiteType;
  seoEnabled: boolean;
  forumEnabled: boolean;
  commerceEnabled: boolean;
  hasForumHome: boolean;
  hasFaq: boolean;
  hasGetStarted: boolean;
  sitemapActive: boolean;
  metadataStatus: StatusLevel;
  schemaStatus: StatusLevel;
  categories: number;
  threads: number;
  clusters: number;
  indexingStatus: string;
  compatibility: CompatibilityLevel;
  requiredPages: RequiredPage[];
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const REQUIRED_PATHS = [
  '/',
  '/about',
  '/services',
  '/contact',
  '/privacy',
  '/terms',
  '/faq',
  '/get-started',
  '/forum',
  '/sitemap.xml',
  '/robots.txt',
];

const MOCK_SITES: SiteAudit[] = [
  {
    id: '1',
    name: 'Memelli',
    domain: 'memelli.com',
    siteType: 'MARKETING',
    seoEnabled: true,
    forumEnabled: true,
    commerceEnabled: true,
    hasForumHome: true,
    hasFaq: true,
    hasGetStarted: true,
    sitemapActive: true,
    metadataStatus: 'complete',
    schemaStatus: 'complete',
    categories: 12,
    threads: 347,
    clusters: 8,
    indexingStatus: 'Indexed',
    compatibility: 'full',
    requiredPages: REQUIRED_PATHS.map((p) => ({ path: p, present: true }))
  },
  {
    id: '2',
    name: 'Prequal Hub',
    domain: 'prequalhub.com',
    siteType: 'PORTAL',
    seoEnabled: true,
    forumEnabled: false,
    commerceEnabled: false,
    hasForumHome: false,
    hasFaq: true,
    hasGetStarted: true,
    sitemapActive: true,
    metadataStatus: 'partial',
    schemaStatus: 'partial',
    categories: 0,
    threads: 0,
    clusters: 3,
    indexingStatus: 'Partial',
    compatibility: 'partial',
    requiredPages: REQUIRED_PATHS.map((p) => ({
      path: p,
      present: !['/forum', '/services'].includes(p)
    }))
  },
  {
    id: '3',
    name: 'Approval Standard',
    domain: 'approvalstandard.com',
    siteType: 'AUTHORITY',
    seoEnabled: true,
    forumEnabled: true,
    commerceEnabled: false,
    hasForumHome: true,
    hasFaq: true,
    hasGetStarted: false,
    sitemapActive: true,
    metadataStatus: 'complete',
    schemaStatus: 'partial',
    categories: 6,
    threads: 89,
    clusters: 5,
    indexingStatus: 'Indexed',
    compatibility: 'partial',
    requiredPages: REQUIRED_PATHS.map((p) => ({
      path: p,
      present: p !== '/get-started'
    }))
  },
  {
    id: '4',
    name: 'LeadPulseLab',
    domain: 'leadpulselab.com',
    siteType: 'MARKETING',
    seoEnabled: false,
    forumEnabled: false,
    commerceEnabled: false,
    hasForumHome: false,
    hasFaq: false,
    hasGetStarted: false,
    sitemapActive: false,
    metadataStatus: 'missing',
    schemaStatus: 'missing',
    categories: 0,
    threads: 0,
    clusters: 0,
    indexingStatus: 'Not Indexed',
    compatibility: 'incompatible',
    requiredPages: REQUIRED_PATHS.map((p) => ({
      path: p,
      present: ['/', '/privacy', '/terms'].includes(p)
    }))
  },
  {
    id: '5',
    name: 'Verified Business Line',
    domain: 'verifiedbusinessline.com',
    siteType: 'PORTAL',
    seoEnabled: true,
    forumEnabled: false,
    commerceEnabled: true,
    hasForumHome: false,
    hasFaq: true,
    hasGetStarted: true,
    sitemapActive: true,
    metadataStatus: 'complete',
    schemaStatus: 'complete',
    categories: 3,
    threads: 0,
    clusters: 2,
    indexingStatus: 'Indexed',
    compatibility: 'partial',
    requiredPages: REQUIRED_PATHS.map((p) => ({
      path: p,
      present: !['/forum', '/about'].includes(p)
    }))
  },
  {
    id: '6',
    name: 'Memelli Store',
    domain: 'store.memelli.com',
    siteType: 'STORE',
    seoEnabled: true,
    forumEnabled: false,
    commerceEnabled: true,
    hasForumHome: false,
    hasFaq: false,
    hasGetStarted: false,
    sitemapActive: true,
    metadataStatus: 'partial',
    schemaStatus: 'complete',
    categories: 8,
    threads: 0,
    clusters: 4,
    indexingStatus: 'Indexed',
    compatibility: 'partial',
    requiredPages: REQUIRED_PATHS.map((p) => ({
      path: p,
      present: !['/forum', '/faq', '/get-started', '/about'].includes(p)
    }))
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function siteTypeColor(type: SiteType): string {
  const map: Record<SiteType, string> = {
    MARKETING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    AUTHORITY: 'bg-red-500/20 text-red-400 border-red-500/30',
    STORE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    BLOG: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    PORTAL: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    LANDING: 'bg-teal-500/20 text-teal-400 border-teal-500/30'
  };
  return map[type] ?? 'bg-[hsl(var(--muted))]/$1 text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]';
}

function compatBadge(level: CompatibilityLevel) {
  const map: Record<CompatibilityLevel, { label: string; cls: string }> = {
    full: { label: 'Full', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    partial: { label: 'Partial', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    incompatible: { label: 'Incompatible', cls: 'bg-red-500/20 text-red-400 border-red-500/30' }
  };
  return map[level];
}

function statusBadge(status: StatusLevel) {
  const map: Record<StatusLevel, { label: string; cls: string }> = {
    complete: { label: 'Complete', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    partial: { label: 'Partial', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    missing: { label: 'Missing', cls: 'bg-red-500/20 text-red-400 border-red-500/30' }
  };
  return map[status];
}

function Dot({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        on ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.4)]'
      }`}
    />
  );
}

function Check({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle className="h-4 w-4 text-emerald-400" />
  ) : (
    <XCircle className="h-4 w-4 text-red-400" />
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SeoCompatibilityPage() {
  const api = useApi();
  const [sites, setSites] = useState<SiteAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSite, setExpandedSite] = useState<string | null>(null);
  const [fixingId, setFixingId] = useState<string | null>(null);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: SiteAudit[] }>('/api/admin/seo/sites');
      const payload = res?.data as any;
      if (payload?.data && Array.isArray(payload.data)) {
        setSites(payload.data);
      } else if (Array.isArray(payload)) {
        setSites(payload);
      } else {
        setSites(MOCK_SITES);
      }
    } catch {
      setSites(MOCK_SITES);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  /* Stats ---------------------------------------------------------- */
  const totalSites = sites.length;
  const fullyCompatible = sites.filter((s) => s.compatibility === 'full').length;
  const partiallyCompatible = sites.filter((s) => s.compatibility === 'partial').length;
  const incompatible = sites.filter((s) => s.compatibility === 'incompatible').length;

  const handleFix = async (siteId: string) => {
    setFixingId(siteId);
    // Simulate auto-provisioning
    await new Promise((r) => setTimeout(r, 2000));
    setSites((prev) =>
      prev.map((s) =>
        s.id === siteId
          ? {
              ...s,
              compatibility: 'full' as CompatibilityLevel,
              requiredPages: s.requiredPages.map((p) => ({ ...p, present: true })),
              hasFaq: true,
              hasGetStarted: true,
              hasForumHome: true,
              sitemapActive: true,
              seoEnabled: true,
              metadataStatus: 'complete' as StatusLevel,
              schemaStatus: 'complete' as StatusLevel
            }
          : s,
      ),
    );
    setFixingId(null);
  };

  /* Render --------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-500/30">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">SEO Compatibility Audit</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Verify all sites meet SEO Universe requirements
            </p>
          </div>
        </div>
      </div>

      {/* Global Stats Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Sites"
          value={totalSites}
          icon={<Globe className="h-5 w-5 text-blue-400" />}
          accent="blue"
        />
        <StatCard
          label="Fully Compatible"
          value={fullyCompatible}
          icon={<CheckCircle className="h-5 w-5 text-emerald-400" />}
          accent="green"
        />
        <StatCard
          label="Partially Compatible"
          value={partiallyCompatible}
          icon={<AlertTriangle className="h-5 w-5 text-yellow-400" />}
          accent="yellow"
        />
        <StatCard
          label="Incompatible"
          value={incompatible}
          icon={<XCircle className="h-5 w-5 text-red-400" />}
          accent="red"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <LoadingGlobe size="lg" />
          <span className="ml-3 text-[hsl(var(--muted-foreground))]">Auditing sites...</span>
        </div>
      )}

      {/* Site Audit Table */}
      {!loading && (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] overflow-hidden">
          {/* Table Header */}
          <div className="hidden xl:grid grid-cols-[2fr_1fr_repeat(7,auto)_1fr_1fr_1fr_1fr_1fr] gap-2 px-5 py-3 bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))] text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider items-center">
            <span>Site</span>
            <span>Type</span>
            <span className="text-center">SEO</span>
            <span className="text-center">Forum</span>
            <span className="text-center">Commerce</span>
            <span className="text-center">Forum Home</span>
            <span className="text-center">FAQ</span>
            <span className="text-center">Get Started</span>
            <span className="text-center">Sitemap</span>
            <span className="text-center">Metadata</span>
            <span className="text-center">Schema</span>
            <span className="text-center">Content</span>
            <span className="text-center">Indexing</span>
            <span className="text-center">Status</span>
          </div>

          {/* Site Rows */}
          {sites.map((site) => {
            const isExpanded = expandedSite === site.id;
            const compat = compatBadge(site.compatibility);
            const meta = statusBadge(site.metadataStatus);
            const schema = statusBadge(site.schemaStatus);
            const isFixing = fixingId === site.id;

            return (
              <div key={site.id} className="border-b border-[hsl(var(--border))] last:border-b-0">
                {/* Main Row */}
                <div
                  onClick={() => setExpandedSite(isExpanded ? null : site.id)}
                  className="cursor-pointer hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  {/* Desktop */}
                  <div className="hidden xl:grid grid-cols-[2fr_1fr_repeat(7,auto)_1fr_1fr_1fr_1fr_1fr] gap-2 px-5 py-4 items-center">
                    {/* Site Name + Domain */}
                    <div className="flex items-center gap-2 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{site.name}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">{site.domain}</div>
                      </div>
                    </div>

                    {/* Type */}
                    <span
                      className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${siteTypeColor(site.siteType)}`}
                    >
                      {site.siteType}
                    </span>

                    {/* Dots: SEO, Forum, Commerce */}
                    <div className="flex justify-center"><Dot on={site.seoEnabled} /></div>
                    <div className="flex justify-center"><Dot on={site.forumEnabled} /></div>
                    <div className="flex justify-center"><Dot on={site.commerceEnabled} /></div>

                    {/* Checks: Forum Home, FAQ, Get Started, Sitemap */}
                    <div className="flex justify-center"><Check ok={site.hasForumHome} /></div>
                    <div className="flex justify-center"><Check ok={site.hasFaq} /></div>
                    <div className="flex justify-center"><Check ok={site.hasGetStarted} /></div>
                    <div className="flex justify-center"><Check ok={site.sitemapActive} /></div>

                    {/* Metadata */}
                    <div className="flex justify-center">
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </div>

                    {/* Schema */}
                    <div className="flex justify-center">
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${schema.cls}`}>
                        {schema.label}
                      </span>
                    </div>

                    {/* Content Counts */}
                    <div className="text-center text-xs text-[hsl(var(--muted-foreground))]">
                      <span title="Categories">{site.categories}</span>
                      {' / '}
                      <span title="Threads">{site.threads}</span>
                      {' / '}
                      <span title="Clusters">{site.clusters}</span>
                    </div>

                    {/* Indexing */}
                    <div className="text-center text-xs text-[hsl(var(--foreground))]">{site.indexingStatus}</div>

                    {/* Compatibility Badge */}
                    <div className="flex justify-center">
                      <span className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-semibold ${compat.cls}`}>
                        {compat.label}
                      </span>
                    </div>
                  </div>

                  {/* Mobile / Tablet Card */}
                  <div className="xl:hidden px-5 py-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-[hsl(var(--foreground))]">{site.name}</div>
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">{site.domain}</div>
                        </div>
                      </div>
                      <span className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-semibold ${compat.cls}`}>
                        {compat.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${siteTypeColor(site.siteType)}`}>
                        {site.siteType}
                      </span>
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${meta.cls}`}>
                        Meta: {meta.label}
                      </span>
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${schema.cls}`}>
                        Schema: {schema.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                      <div className="flex items-center gap-1.5"><Dot on={site.seoEnabled} /> SEO</div>
                      <div className="flex items-center gap-1.5"><Dot on={site.forumEnabled} /> Forum</div>
                      <div className="flex items-center gap-1.5"><Dot on={site.commerceEnabled} /> Commerce</div>
                      <div className="text-[hsl(var(--foreground))]">{site.indexingStatus}</div>
                    </div>
                  </div>
                </div>

                {/* Expanded: Required Pages + Actions */}
                {isExpanded && (
                  <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-5 py-5">
                    <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
                      {/* Required Pages Checklist */}
                      <div>
                        <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Required Pages Checklist
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {site.requiredPages.map((page) => (
                            <div
                              key={page.path}
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-mono ${
                                page.present
                                  ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                                  : 'border-red-500/20 bg-red-500/5 text-red-400'
                              }`}
                            >
                              {page.present ? (
                                <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
                              )}
                              <span className="truncate">{page.path}</span>
                            </div>
                          ))}
                        </div>

                        {/* Content Summary */}
                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                          <span className="flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-blue-400" />
                            {site.categories} Categories
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                            {site.threads} Threads
                          </span>
                          <span className="flex items-center gap-1.5">
                            <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
                            {site.clusters} Clusters
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Search className="h-3.5 w-3.5 text-blue-400" />
                            {site.indexingStatus}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 min-w-[180px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFix(site.id);
                          }}
                          disabled={isFixing || site.compatibility === 'full'}
                          className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                            site.compatibility === 'full'
                              ? 'border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed'
                              : 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-red-500/20 hover:border-blue-500/50'
                          }`}
                        >
                          {isFixing ? (
                            <LoadingGlobe size="sm" />
                          ) : (
                            <Wrench className="h-4 w-4" />
                          )}
                          {isFixing ? 'Fixing...' : site.compatibility === 'full' ? 'All Good' : 'Fix Compatibility'}
                        </button>

                        <a
                          href={`https://${site.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Site
                        </a>

                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all"
                        >
                          <Settings className="h-4 w-4" />
                          Edit SEO Config
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty State */}
          {sites.length === 0 && !loading && (
            <div className="py-16 text-center text-[hsl(var(--muted-foreground))]">
              <Globe className="mx-auto h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No sites found in the universe.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon,
  accent
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: 'blue' | 'green' | 'yellow' | 'red';
}) {
  const borderMap: Record<string, string> = {
    blue: 'border-blue-500/20',
    green: 'border-emerald-500/20',
    yellow: 'border-yellow-500/20',
    red: 'border-red-500/20'
  };
  const glowMap: Record<string, string> = {
    blue: 'shadow-[0_0_15px_rgba(59,130,246,0.06)]',
    green: 'shadow-[0_0_15px_rgba(16,185,129,0.06)]',
    yellow: 'shadow-[0_0_15px_rgba(234,179,8,0.06)]',
    red: 'shadow-[0_0_15px_rgba(239,68,68,0.06)]'
  };

  return (
    <div
      className={`rounded-xl border bg-[hsl(var(--muted))] p-5 ${borderMap[accent]} ${glowMap[accent]}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold text-[hsl(var(--foreground))]">{value}</div>
    </div>
  );
}
