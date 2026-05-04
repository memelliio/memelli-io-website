'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Globe } from 'lucide-react';
import { useApi } from '../../../../../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';

interface Ranking {
  keyword: string;
  position: number;
  impressions: number;
  clicks: number;
}

interface Article {
  id: string;
  title: string;
  content?: string;
  status: string;
  keyword?: string;
  meta_description?: string;
  metaDescription?: string;
  word_count?: number;
  wordCount?: number;
  cluster_name?: string;
  clusterName?: string;
  updated_at?: string;
  updatedAt?: string;
  published_at?: string;
  publishedAt?: string;
  rankings?: Ranking[];
}

const statusVariant: Record<string, 'muted' | 'warning' | 'primary' | 'success'> = {
  DRAFT: 'muted',
  READY: 'primary',
  PUBLISHED: 'success',
  INDEXED: 'success',
  GENERATING: 'warning',
  PENDING: 'muted',
};

export default function ArticleEditorPage() {
  const params = useParams();
  const articleId = params.articleId as string;
  const api = useApi();

  const [article, setArticle] = useState<Article | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({ title: '', meta_description: '' });
  const [savingMeta, setSavingMeta] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [indexing, setIndexing] = useState(false);

  useEffect(() => {
    async function load() {
      const artRes = await api.get<Article>(`/api/seo/articles/${articleId}`);
      if (artRes.error) { setError(artRes.error); setIsLoading(false); return; }
      const art = artRes.data as Article;
      setArticle(art);
      setMetaForm({ title: art.title ?? '', meta_description: art.metaDescription ?? art.meta_description ?? '' });
      // Rankings are included in the article response from the backend
      const rankList = (art as any).rankings ?? [];
      setRankings(rankList);
      setIsLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  async function publish() {
    setPublishing(true);
    const res = await api.patch<Article | { article: Article }>(`/api/seo/articles/${articleId}`, { status: 'PUBLISHED' });
    if (!res.error) {
      const updated = (res.data as { article: Article })?.article ?? res.data as Article;
      setArticle(updated);
    }
    setPublishing(false);
  }

  async function submitToIndex() {
    setIndexing(true);
    await api.post(`/api/seo/articles/${articleId}/index`, {});
    setIndexing(false);
  }

  async function saveMeta() {
    setSavingMeta(true);
    const res = await api.patch<Article | { article: Article }>(`/api/seo/articles/${articleId}`, {
      title: metaForm.title,
      meta_description: metaForm.meta_description,
    });
    if (!res.error) {
      const updated = (res.data as { article: Article })?.article ?? res.data as Article;
      setArticle(updated);
      setEditingMeta(false);
    }
    setSavingMeta(false);
  }

  if (isLoading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (error) return <p className="text-primary text-sm">{error}</p>;
  if (!article) return null;

  const canPublish = ['DRAFT', 'READY'].includes(article.status);
  const canIndex = article.status === 'PUBLISHED';

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      <Link href="/dashboard/seo/articles" className="text-sm text-muted-foreground leading-relaxed hover:text-foreground block transition-all duration-200">← Articles</Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-lg font-semibold tracking-tight text-foreground leading-snug">{article.title}</CardTitle>
                <Badge variant={statusVariant[article.status] ?? 'muted'} className="shrink-0 capitalize">
                  {article.status.toLowerCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {article.content ? (
                <div
                  className="prose prose-invert prose-sm max-w-none text-foreground overflow-y-auto max-h-[60vh]"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              ) : (
                <p className="text-muted-foreground leading-relaxed text-sm">No content available.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardHeader><CardTitle className="text-sm font-semibold tracking-tight text-foreground">Actions</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-2">
              {canPublish && (
                <Button className="w-full" onClick={publish} isLoading={publishing}>Publish</Button>
              )}
              {canIndex && (
                <Button className="w-full" variant="secondary" onClick={submitToIndex} isLoading={indexing}>
                  <Globe className="h-4 w-4" /> Submit to Index
                </Button>
              )}
              <Button className="w-full" variant="ghost" onClick={() => setEditingMeta(!editingMeta)}>
                {editingMeta ? 'Cancel Edit Meta' : 'Edit Meta'}
              </Button>
            </CardContent>
          </Card>

          {editingMeta && (
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader><CardTitle className="text-sm font-semibold tracking-tight text-foreground">Edit Meta</CardTitle></CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Title</label>
                  <input
                    type="text"
                    value={metaForm.title}
                    onChange={(e) => setMetaForm({ ...metaForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-card backdrop-blur-xl border border-white/[0.04] rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Meta Description</label>
                  <textarea
                    value={metaForm.meta_description}
                    onChange={(e) => setMetaForm({ ...metaForm, meta_description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-card backdrop-blur-xl border border-white/[0.04] rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none transition-all duration-200"
                  />
                </div>
                <Button size="sm" onClick={saveMeta} isLoading={savingMeta}>Save</Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
            <CardHeader><CardTitle className="text-sm font-semibold tracking-tight text-foreground">Details</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Keyword</span>
                <p className="mt-0.5 text-foreground">{article.keyword ?? '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cluster</span>
                <p className="mt-0.5 text-foreground">{article.clusterName ?? article.cluster_name ?? '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Word Count</span>
                <p className="mt-0.5 text-foreground">{article.wordCount ?? article.word_count ?? '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Meta Description</span>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{article.metaDescription ?? article.meta_description ?? '—'}</p>
              </div>
              {(article.updatedAt ?? article.updated_at) && (
                <div>
                  <span className="text-muted-foreground">Updated</span>
                  <p className="mt-0.5 text-foreground">{new Date(article.updatedAt ?? article.updated_at!).toLocaleDateString()}</p>
                </div>
              )}
              {(article.publishedAt ?? article.published_at) && (
                <div>
                  <span className="text-muted-foreground">Published</span>
                  <p className="mt-0.5 text-foreground">{new Date(article.publishedAt ?? article.published_at!).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {rankings.length > 0 && (
            <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
              <CardHeader><CardTitle className="text-sm font-semibold tracking-tight text-foreground">Rankings</CardTitle></CardHeader>
              <CardContent className="pt-0 space-y-2 text-sm">
                {rankings.map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">{r.keyword}</span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-foreground">#{r.position}</span>
                      <span className="text-muted-foreground">{r.clicks} clicks</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
