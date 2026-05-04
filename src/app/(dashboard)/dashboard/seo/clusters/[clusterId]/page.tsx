'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Zap, AlertCircle, CheckCircle, Edit2 } from 'lucide-react';
import { API_URL as API } from '@/lib/config';

import { LoadingGlobe } from '@/components/ui/loading-globe';
async function api(path: string, opts?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers
    }
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface Cluster {
  id: string;
  name: string;
  seedKeyword?: string;
  description?: string;
  createdAt: string;
}

interface Question {
  id: string;
  question: string;
  keyword?: string;
  status: string;
  article_id?: string;
  createdAt: string;
}

interface Article {
  id: string;
  title: string;
  status: string;
  wordCount?: number;
  keyword?: string;
  createdAt: string;
}

const questionStatusColors: Record<string, string> = {
  PENDING: 'bg-white/[0.04] text-muted-foreground border-white/[0.06]',
  GENERATING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  ARTICLE_DRAFTED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PUBLISHED: 'bg-green-500/10 text-green-400 border-green-500/20'
};

const articleStatusColors: Record<string, string> = {
  PUBLISHED: 'bg-green-500/10 text-green-400 border-green-500/20',
  DRAFT: 'bg-white/[0.04] text-muted-foreground border-white/[0.06]',
  GENERATING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  PENDING: 'bg-white/[0.03] text-muted-foreground border-white/[0.06]',
  ARCHIVED: 'bg-primary/10 text-primary border-primary/20'
};

export default function ClusterDetailPage() {
  const params = useParams<{ clusterId: string }>();
  const clusterId = params.clusterId;

  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'articles'>('questions');
  const [generatingAll, setGeneratingAll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api(`/api/seo/clusters/${clusterId}`),
      api(`/api/seo/questions?clusterId=${clusterId}&perPage=50`).catch(() => ({ items: [] })),
      api(`/api/seo/articles?clusterId=${clusterId}&perPage=50`).catch(() => ({ items: [] })),
    ])
      .then(([clusterRaw, questionsRaw, articlesRaw]) => {
        // Backend returns { success, data: cluster } for single cluster
        setCluster(clusterRaw?.data ?? clusterRaw);
        // Backend returns { success, data: { items: [...] } } for questions
        const qd = questionsRaw?.data ?? questionsRaw;
        const qList = qd?.items ?? (Array.isArray(qd) ? qd : []);
        // Backend returns { success, data: [...], meta } for articles
        const ad = articlesRaw?.data ?? articlesRaw;
        const aList = Array.isArray(ad) ? ad : ad?.items ?? [];
        setQuestions(qList);
        setArticles(aList);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load cluster'))
      .finally(() => setLoading(false));
  }, [clusterId]);

  async function handleGenerateAll() {
    setGeneratingAll(true);
    try {
      const raw = await api('/api/seo/generate/generate-batch', {
        method: 'POST',
        body: JSON.stringify({ clusterId })
      });
      // Backend returns { success, data: { queued, jobIds } }
      const data = raw?.data ?? raw;
      const count = data.queued ?? data.count ?? '—';
      showToast(`${count} articles queued for generation`);
      // Update local question statuses
      setQuestions((prev) =>
        prev.map((q) => (q.status === 'PENDING' ? { ...q, status: 'GENERATING' } : q))
      );
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to start generation');
    } finally {
      setGeneratingAll(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <LoadingGlobe size="lg" />
      </div>
    );
  }

  if (error || !cluster) {
    return (
      <div className="min-h-screen bg-card text-foreground p-6 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-primary" />
        <p className="text-primary">{error ?? 'Cluster not found'}</p>
        <Link href="/dashboard/seo" className="text-primary hover:text-primary/80 text-sm transition-colors">Back to SEO</Link>
      </div>
    );
  }

  const publishedCount = articles.filter((a) => a.status === 'PUBLISHED').length;
  const pendingCount = questions.filter((q) => q.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-card text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back nav */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard/seo" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            SEO
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground">Clusters</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground">{cluster.name}</span>
        </div>

        {/* Cluster header */}
        <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="text-2xl tracking-tight font-semibold text-foreground">{cluster.name}</h1>
              {cluster.seedKeyword && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Seed keyword:</span>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary/80 border border-primary/20 rounded-full text-xs font-medium">
                    {cluster.seedKeyword}
                  </span>
                </div>
              )}
              {cluster.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">{cluster.description}</p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/[0.04]">
            <div className="text-center rounded-xl bg-card backdrop-blur-xl border border-white/[0.04] p-3 transition-all duration-200">
              <p className="text-2xl font-semibold tracking-tight text-foreground">{questions.length}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Questions</p>
            </div>
            <div className="text-center rounded-xl bg-card backdrop-blur-xl border border-white/[0.04] p-3 transition-all duration-200">
              <p className="text-2xl font-semibold tracking-tight text-foreground">{articles.length}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Articles</p>
            </div>
            <div className="text-center rounded-xl bg-card backdrop-blur-xl border border-white/[0.04] p-3 transition-all duration-200">
              <p className="text-2xl font-semibold tracking-tight text-green-400">{publishedCount}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Published</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-1 w-fit">
          {(['questions', 'articles'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              <span className={`ml-2 px-1.5 py-0.5 rounded-lg text-xs ${
                activeTab === tab ? 'bg-primary/80/50 text-foreground' : 'bg-white/[0.04] text-muted-foreground'
              }`}>
                {tab === 'questions' ? questions.length : articles.length}
              </span>
            </button>
          ))}
        </div>

        {/* Questions tab */}
        {activeTab === 'questions' && (
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
              <div>
                <h2 className="tracking-tight font-semibold text-foreground">Question Bank</h2>
                {pendingCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">{pendingCount} pending generation</p>
                )}
              </div>
              <button
                onClick={handleGenerateAll}
                disabled={generatingAll || pendingCount === 0}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all duration-200"
              >
                {generatingAll ? (
                  <LoadingGlobe size="sm" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {generatingAll ? 'Queueing...' : 'Generate All'}
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Question</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Keyword</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Article</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                      No questions in this cluster yet.
                    </td>
                  </tr>
                ) : (
                  questions.map((q) => (
                    <tr key={q.id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.04] transition-all duration-200">
                      <td className="px-5 py-3 text-foreground max-w-sm">{q.question}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{q.keyword || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${questionStatusColors[q.status] ?? 'bg-white/[0.04] text-muted-foreground border-white/[0.06]'}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {q.article_id ? (
                          <Link
                            href={`/dashboard/seo/articles/${q.article_id}/edit`}
                            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" /> View
                          </Link>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Articles tab */}
        {activeTab === 'articles' && (
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04]">
              <h2 className="tracking-tight font-semibold text-foreground">Articles</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Title</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Keyword</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Words</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {articles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                      No articles generated for this cluster yet.
                    </td>
                  </tr>
                ) : (
                  articles.map((a) => (
                    <tr key={a.id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.04] transition-all duration-200">
                      <td className="px-5 py-3 text-foreground max-w-xs truncate">{a.title}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{a.keyword || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${articleStatusColors[a.status] ?? 'bg-white/[0.04] text-muted-foreground border-white/[0.06]'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{a.wordCount ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/seo/articles/${a.id}/edit`}
                          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 justify-end transition-colors"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl rounded-2xl shadow-2xl text-sm text-foreground flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}
