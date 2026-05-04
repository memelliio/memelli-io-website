'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Globe, Send, CheckCircle, AlertCircle} from 'lucide-react';
import Link from 'next/link';
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

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Article {
  id: string;
  title: string;
  content: string;
  metaDescription?: string;
  status: string;
  keyword?: string;
  wordCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export default function ArticleEditPage() {
  const params = useParams<{ articleId: string }>();
  const router = useRouter();
  const articleId = params.articleId;

  const [article, setArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [publishing, setPublishing] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexSuccess, setIndexSuccess] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);

  useEffect(() => {
    api(`/api/seo/articles/${articleId}`)
      .then((raw) => {
        // Backend returns { success, data: article }
        const a: Article = raw?.data ?? raw;
        setArticle(a);
        setTitle(a.title ?? '');
        setContent(a.content ?? '');
        setMetaDescription(a.metaDescription ?? '');
        setStatus(a.status ?? 'DRAFT');
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load article'))
      .finally(() => setLoading(false));
  }, [articleId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const saveArticle = useCallback(
    async (titleVal: string, contentVal: string, metaVal: string) => {
      setSaveState('saving');
      try {
        await api(`/api/seo/articles/${articleId}`, {
          method: 'PATCH',
          body: JSON.stringify({ title: titleVal, content: contentVal, metaDescription: metaVal })
        });
        setSaveState('saved');
        isDirty.current = false;
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
        setTimeout(() => setSaveState('idle'), 3000);
      }
    },
    [articleId]
  );

  const triggerAutosave = useCallback(
    (titleVal: string, contentVal: string, metaVal: string) => {
      isDirty.current = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveArticle(titleVal, contentVal, metaVal);
      }, 3000);
    },
    [saveArticle]
  );

  function handleTitleChange(val: string) {
    setTitle(val);
    triggerAutosave(val, content, metaDescription);
  }

  function handleContentChange(val: string) {
    setContent(val);
    triggerAutosave(title, val, metaDescription);
  }

  function handleMetaChange(val: string) {
    setMetaDescription(val);
    triggerAutosave(title, content, val);
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      await api(`/api/seo/articles/${articleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PUBLISHED' })
      });
      setStatus('PUBLISHED');
      showToast('Article published');
    } catch {
      showToast('Failed to publish');
    } finally {
      setPublishing(false);
    }
  }

  async function handleSubmitToIndex() {
    setIndexing(true);
    try {
      await api(`/api/seo/articles/${articleId}/index`, { method: 'POST' });
      setIndexSuccess(true);
      showToast('Submitted to index');
    } catch {
      showToast('Failed to submit to index');
    } finally {
      setIndexing(false);
    }
  }

  const wordCount = countWords(content);

  const statusColors: Record<string, string> = {
    PUBLISHED: 'bg-green-500/10 text-green-400 border-green-500/20',
    DRAFT: 'bg-white/[0.04] text-muted-foreground border-white/[0.06]',
    GENERATING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    PENDING: 'bg-white/[0.03] text-muted-foreground border-white/[0.06]',
    ARCHIVED: 'bg-primary/10 text-primary border-primary/20'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <LoadingGlobe size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-card text-foreground p-6 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-primary" />
        <p className="text-muted-foreground leading-relaxed">{error}</p>
        <Link href="/dashboard/seo" className="text-primary hover:text-primary/80 text-sm transition-all duration-200">Back to SEO</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card text-foreground flex flex-col">
      {/* Header */}
      <div className="border-b border-white/[0.04] bg-card backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/seo"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-sm text-muted-foreground">SEO Articles</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-foreground truncate max-w-xs">{title || 'Untitled'}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Autosave indicator */}
            <div className="flex items-center gap-1.5 text-xs">
              {saveState === 'saving' && (
                <>
                  <LoadingGlobe size="sm" />
                  <span className="text-muted-foreground">Saving...</span>
                </>
              )}
              {saveState === 'saved' && (
                <>
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">Saved</span>
                </>
              )}
              {saveState === 'error' && (
                <>
                  <AlertCircle className="w-3 h-3 text-primary" />
                  <span className="text-primary">Save failed</span>
                </>
              )}
              {saveState === 'idle' && isDirty.current && (
                <span className="text-muted-foreground">Unsaved changes</span>
              )}
            </div>
            <button
              onClick={() => saveArticle(title, content, metaDescription)}
              disabled={saveState === 'saving'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.04] border border-white/[0.04] text-foreground rounded-xl text-sm font-semibold tracking-tight transition-all duration-200 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100dvh - 57px)' }}>
        {/* Editor — 70% */}
        <div className="flex flex-col flex-1 overflow-hidden" style={{ width: '70%' }}>
          <div className="px-6 pt-5 pb-2">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Article title..."
              className="w-full text-2xl font-semibold tracking-tight bg-transparent text-foreground placeholder-muted-foreground border-none outline-none focus:outline-none"
            />
          </div>
          <div className="flex-1 px-6 pb-6 overflow-hidden">
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start writing your article content here..."
              className="w-full h-full bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl text-foreground placeholder-muted-foreground font-mono text-sm p-4 resize-none focus:outline-none focus:border-primary/30 transition-all duration-200"
              style={{ fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", monospace' }}
            />
          </div>
        </div>

        {/* Sidebar — 30% */}
        <div
          className="border-l border-white/[0.04] bg-card backdrop-blur-xl overflow-y-auto flex flex-col gap-0"
          style={{ width: '30%', minWidth: '280px', maxWidth: '420px' }}
        >
          {/* Status */}
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <h3 className="text-xs font-semibold tracking-tight text-muted-foreground uppercase tracking-wider mb-3">Status</h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[status] ?? 'bg-white/[0.04] text-muted-foreground border-white/[0.06]'}`}>
              {status}
            </span>
          </div>

          {/* Word count */}
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <h3 className="text-xs font-semibold tracking-tight text-muted-foreground uppercase tracking-wider mb-2">Word Count</h3>
            <p className="text-2xl font-bold tracking-tight text-primary">{wordCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">words</p>
          </div>

          {/* Keyword */}
          {article?.keyword && (
            <div className="px-5 py-4 border-b border-white/[0.04]">
              <h3 className="text-xs font-semibold tracking-tight text-muted-foreground uppercase tracking-wider mb-2">Target Keyword</h3>
              <span className="px-2.5 py-1 bg-primary/10 text-primary/80 border border-primary/20 rounded-full text-xs font-medium">
                {article.keyword}
              </span>
            </div>
          )}

          {/* Meta description */}
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <h3 className="text-xs font-semibold tracking-tight text-muted-foreground uppercase tracking-wider mb-2">Meta Description</h3>
            <textarea
              value={metaDescription}
              onChange={(e) => handleMetaChange(e.target.value)}
              placeholder="Enter meta description (150-160 chars)..."
              rows={4}
              maxLength={160}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-foreground placeholder-muted-foreground text-sm resize-none focus:outline-none focus:border-primary/30 transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{metaDescription.length}/160</p>
          </div>

          {/* Dates */}
          {article && (
            <div className="px-5 py-4 border-b border-white/[0.04] space-y-2">
              <h3 className="text-xs font-semibold tracking-tight text-muted-foreground uppercase tracking-wider mb-2">Dates</h3>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Created</span>
                <span className="text-muted-foreground">{new Date(article.createdAt).toLocaleDateString()}</span>
              </div>
              {article.updatedAt && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Updated</span>
                  <span className="text-muted-foreground">{new Date(article.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="px-5 py-4 space-y-3 mt-auto">
            {status !== 'PUBLISHED' && (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary disabled:opacity-50 text-white rounded-xl text-sm font-semibold tracking-tight transition-all duration-200"
              >
                {publishing ? <LoadingGlobe size="sm" /> : <Globe className="w-4 h-4" />}
                {publishing ? 'Publishing...' : 'Publish'}
              </button>
            )}
            {status === 'PUBLISHED' && (
              <button
                onClick={handleSubmitToIndex}
                disabled={indexing || indexSuccess}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary disabled:opacity-50 text-white rounded-xl text-sm font-semibold tracking-tight transition-all duration-200"
              >
                {indexing ? (
                  <LoadingGlobe size="sm" />
                ) : indexSuccess ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {indexing ? 'Submitting...' : indexSuccess ? 'Submitted' : 'Submit to Index'}
              </button>
            )}
            <button
              onClick={() => router.back()}
              className="w-full px-4 py-2 bg-white/[0.04] hover:bg-white/[0.04] border border-white/[0.04] text-muted-foreground leading-relaxed rounded-xl text-sm font-medium transition-all duration-200"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl rounded-2xl shadow-2xl text-sm text-foreground flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}
