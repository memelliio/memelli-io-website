'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import { Card, CardContent } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';

interface Article {
  id: string;
  title: string;
  keyword?: string;
  status: string;
  word_count?: number;
  wordCount?: number;
  cluster?: { id: string; name: string } | null;
  cluster_name?: string;
  clusterName?: string;
  updated_at?: string;
  updatedAt?: string;
  published_at?: string;
  publishedAt?: string;
}

const STATUS_TABS = ['All', 'Draft', 'Ready', 'Published', 'Indexed'];

const statusVariant: Record<string, 'muted' | 'warning' | 'primary' | 'success'> = {
  DRAFT: 'muted',
  READY: 'primary',
  PUBLISHED: 'success',
  INDEXED: 'success',
  GENERATING: 'warning',
  PENDING: 'muted',
};

const PAGE_SIZE = 25;

export default function ArticlesPage() {
  const api = useApi();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filtered, setFiltered] = useState<Article[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [generatingAll, setGeneratingAll] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await api.get<any>('/api/seo/articles');
      if (res.error) { setError(res.error); setIsLoading(false); return; }
      // useApi preserves { data, meta } when meta is present
      const d = res.data ?? {};
      const list: Article[] = Array.isArray(d) ? d
        : Array.isArray(d.data) ? d.data
        : d.articles ?? d.items ?? [];
      setArticles(list);
      setFiltered(list);
      setIsLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const list = activeTab === 'All'
      ? articles
      : articles.filter((a) => a.status === activeTab.toUpperCase());
    setFiltered(list);
    setPage(1);
  }, [activeTab, articles]);

  async function generateAllPending() {
    setGeneratingAll(true);
    await api.post('/api/seo/questions/generate-batch', {});
    setGeneratingAll(false);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Article Manager</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">Generated SEO articles</p>
        </div>
        <Button onClick={generateAllPending} isLoading={generatingAll} variant="secondary">
          <Zap className="h-4 w-4" /> Generate All Pending
        </Button>
      </div>

      <div className="flex gap-1 border-b border-white/[0.04]">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 -mb-px ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && <p className="text-primary text-sm">{error}</p>}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04] text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Title</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Keyword</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Words</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Cluster</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Updated</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Published</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((a) => (
                    <tr key={a.id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.04] transition-all duration-200">
                      <td className="px-4 py-3 max-w-xs">
                        <Link href={`/dashboard/seo/articles/${a.id}`} className="text-primary hover:text-primary/80 line-clamp-2 transition-colors">{a.title}</Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{a.keyword ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[a.status] ?? 'muted'} className="capitalize">{a.status.toLowerCase()}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{a.wordCount ?? a.word_count ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{a.cluster?.name ?? a.clusterName ?? a.cluster_name ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {(a.updatedAt ?? a.updated_at) ? new Date(a.updatedAt ?? a.updated_at!).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {(a.publishedAt ?? a.published_at) ? new Date(a.publishedAt ?? a.published_at!).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground leading-relaxed">No articles found.</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <span className="text-sm text-muted-foreground leading-relaxed">Page {page} of {totalPages}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
