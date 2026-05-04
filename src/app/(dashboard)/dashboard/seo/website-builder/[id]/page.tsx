'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Settings,
  FileText,
  MessageSquare,
  Palette,
  Eye,
  Rocket,
  Plus,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import {
  PageHeader,
  Button,
  Badge,
  Skeleton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Input,
  Toggle,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@memelli/ui';
import { useApi } from '../../../../../../hooks/useApi';

interface SitePage {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  updatedAt: string;
}

interface SiteDetail {
  id: string;
  name: string;
  domain: string;
  industry: string;
  region: string;
  status: string;
  theme: string;
  primaryColor: string;
  forumEnabled: boolean;
  forumCategories: string[];
  pages: SitePage[];
  createdAt: string;
  updatedAt: string;
}

const THEMES = [
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'bold', label: 'Bold' },
];

export default function SiteEditorPage() {
  const params = useParams();
  const siteId = params.id as string;
  const api = useApi();
  const queryClient = useQueryClient();

  const [theme, setTheme] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [forumEnabled, setForumEnabled] = useState<boolean | null>(null);

  const { data, isLoading } = useQuery<SiteDetail>({
    queryKey: ['website-detail', siteId],
    queryFn: async () => {
      // useApi auto-unwraps { success, data } -> data (the SiteDetail object)
      const res = await api.get<SiteDetail>(`/api/seo/websites/${siteId}`);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {};
      if (theme !== null) body.theme = theme;
      if (primaryColor !== null) body.primaryColor = primaryColor;
      if (forumEnabled !== null) body.forumEnabled = forumEnabled;
      const res = await api.patch(`/api/seo/websites/${siteId}`, body);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-detail', siteId] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/seo/websites/${siteId}/publish`, {});
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-detail', siteId] });
    },
  });

  const site = data;

  if (isLoading) {
    return (
      <div className="bg-card min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
          <Skeleton className="h-10 w-1/2 bg-card rounded-2xl" />
          <Skeleton className="h-96 w-full bg-card rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="bg-card min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <p className="text-muted-foreground leading-relaxed">Site not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card min-h-screen">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <PageHeader
          title={site.name}
          subtitle={site.domain || 'No domain configured'}
          breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'SEO', href: '/dashboard/seo' },
            { label: 'Website Builder', href: '/dashboard/seo/website-builder' },
            { label: site.name },
          ]}
          actions={
            <div className="flex items-center gap-3">
              {site.domain && (
                <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" leftIcon={<ExternalLink className="h-4 w-4 text-muted-foreground" />}>
                    Preview
                  </Button>
                </a>
              )}
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Rocket className="h-4 w-4" />}
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          }
          className="mb-8"
        />

        <Tabs defaultTab="pages">
          <TabList>
            <Tab id="pages">Pages ({site.pages.length})</Tab>
            <Tab id="forum">Forum Setup</Tab>
            <Tab id="theme">Theme</Tab>
          </TabList>
          <TabPanels>
            {/* Pages tab */}
            <TabPanel id="pages">
              <div className="mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Site Pages</h3>
                  <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4 text-red-400" />}>
                    Add Page
                  </Button>
                </div>
                <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Title</TableHead>
                        <TableHead className="w-32 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Slug</TableHead>
                        <TableHead className="w-24 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Type</TableHead>
                        <TableHead className="w-24 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Status</TableHead>
                        <TableHead className="w-28 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Updated</TableHead>
                        <TableHead className="w-16" />
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-white/[0.04]">
                      {site.pages.map((p) => (
                        <TableRow key={p.id} className="hover:bg-white/[0.04] transition-all duration-200 border-white/[0.04]">
                          <TableCell className="font-medium text-foreground">{p.title}</TableCell>
                          <TableCell className="text-sm text-muted-foreground font-mono leading-relaxed">/{p.slug}</TableCell>
                          <TableCell><Badge variant="default">{p.type}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={p.status === 'published' ? 'success' : 'muted'}>{p.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground leading-relaxed">
                            {new Date(p.updatedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Link href={`/dashboard/seo/website-builder/${siteId}/pages/${p.id}`}>
                              <Button variant="ghost" size="sm">Edit</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabPanel>

            {/* Forum setup */}
            <TabPanel id="forum">
              <div className="mt-6 space-y-6">
                <div className="flex items-center justify-between bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
                  <div>
                    <p className="text-sm font-medium text-foreground">Enable Forum</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Attach an SEO-optimized forum to this site</p>
                  </div>
                  <Toggle
                    checked={forumEnabled ?? site.forumEnabled}
                    onChange={(v) => setForumEnabled(v)}
                  />
                </div>

                {(forumEnabled ?? site.forumEnabled) && (
                  <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">Forum Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {site.forumCategories.length === 0 ? (
                        <p className="text-sm text-muted-foreground leading-relaxed py-6 text-center">No categories configured.</p>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {site.forumCategories.map((cat) => (
                            <Badge key={cat} variant="primary">{cat}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabPanel>

            {/* Theme tab */}
            <TabPanel id="theme">
              <div className="mt-6 space-y-6">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3 block">Theme</label>
                  <Select
                    value={theme ?? site.theme}
                    onChange={(v) => setTheme(v)}
                    options={THEMES}
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3 block">Primary Color</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={primaryColor ?? site.primaryColor ?? '#3b82f6'}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-12 w-12 rounded-xl border border-white/[0.04] bg-card cursor-pointer transition-all duration-200 hover:border-white/[0.08]"
                    />
                    <Input
                      value={primaryColor ?? site.primaryColor ?? '#3b82f6'}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-32 font-mono"
                    />
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all duration-200"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Theme'}
                </Button>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
}