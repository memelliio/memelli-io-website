'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Globe, Plus, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';
import {
  PageHeader,
  Button,
  Badge,
  Skeleton,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@memelli/ui';
import { useApi } from '../../../../../hooks/useApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Site {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  region?: string;
  status?: string;
  published?: boolean;
  pageCount?: number;
  _count?: { pages: number };
  theme?: any;
  config?: any;
  forumEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SitesResponse {
  success: boolean;
  data: Site[];
  meta: { total: number };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const statusVariant: Record<string, 'success' | 'warning' | 'muted' | 'primary'> = {
  published: 'success',
  draft: 'muted',
  building: 'warning',
  preview: 'primary',
};

function unwrapSites(raw: unknown): Site[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as Site[];
  if (Array.isArray(obj.sites)) return obj.sites as Site[];
  return [];
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

/* ------------------------------------------------------------------ */
/*  Skeleton cards                                                     */
/* ------------------------------------------------------------------ */

function SiteCardSkeleton() {
  return (
    <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded mt-2" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-8 rounded" />
          <Skeleton className="h-8 rounded" />
        </div>
        <Skeleton className="h-4 w-1/3 rounded mt-4" />
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function WebsiteBuilderPage() {
  const api = useApi();
  const router = useRouter();

  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ['website-builder-sites'],
    queryFn: async () => {
      const res = await api.get<SitesResponse>('/api/website-builder/sites');
      if (res.error) throw new Error(res.error);
      return unwrapSites(res.data);
    },
  });

  return (
    <div className="bg-card min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <PageHeader
          title="Website Builder"
          subtitle={`${sites.length} site${sites.length !== 1 ? 's' : ''}`}
          breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'SEO', href: '/dashboard/seo' },
            { label: 'Website Builder' },
          ]}
          actions={
            <Link href="/dashboard/seo/website-builder/new">
              <Button variant="primary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} className="bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all duration-200">
                Create Site
              </Button>
            </Link>
          }
          className="mb-2"
        />

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SiteCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && sites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-2xl bg-red-500/10 p-6 mb-6 backdrop-blur-xl border border-white/[0.04]">
              <Globe className="h-8 w-8 text-red-400 mx-auto" />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground mb-2">No websites yet</h3>
            <p className="text-muted-foreground leading-relaxed max-w-sm mb-8">
              Create your first website with auto-generated pages, built-in SEO, and a community forum.
            </p>
            <Link href="/dashboard/seo/website-builder/new">
              <Button variant="primary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} className="bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all duration-200">
                Create Site
              </Button>
            </Link>
          </div>
        )}

        {/* Site cards grid */}
        {!isLoading && sites.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
              <Card
                key={site.id}
                className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200 cursor-pointer group"
                onClick={() => router.push(`/dashboard/seo/website-builder/${site.id}`)}
              >
                <CardHeader className="pb-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-foreground text-lg font-semibold truncate group-hover:text-red-300 transition-all duration-200">
                        {site.name}
                      </CardTitle>
                      {site.domain && (
                        <p className="text-muted-foreground font-mono text-sm mt-1 truncate">
                          {site.domain}
                        </p>
                      )}
                    </div>
                    <Badge variant={statusVariant[site.status ?? (site.published ? 'published' : 'draft')] ?? 'muted'} className="shrink-0 capitalize text-[11px] uppercase tracking-wider">
                      {site.status ?? (site.published ? 'published' : 'draft')}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 px-6 pb-6 space-y-4">
                  {/* Stats row */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="tabular-nums">{site.pageCount ?? site._count?.pages ?? 0}</span>
                      <span className="text-muted-foreground">pages</span>
                    </div>
                    {site.theme && typeof site.theme === 'object' && site.theme.colorScheme && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{site.theme.colorScheme}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {site.industry && (
                      <Badge variant="default" className="text-[11px] bg-muted text-foreground border-white/[0.06]">{site.industry}</Badge>
                    )}
                    {site.forumEnabled && (
                      <Badge variant="primary" className="text-[11px] bg-red-500/[0.08] text-red-300 border-red-500/20">Forum</Badge>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-white/[0.04]">
                    <Calendar className="h-3 w-3" />
                    <span>Created {fmtDate(site.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}