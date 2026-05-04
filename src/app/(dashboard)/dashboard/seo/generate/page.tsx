'use client';

import { useEffect, useState, useRef } from 'react';
import { Zap, Search, CheckCircle, List, LayoutList } from 'lucide-react';
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

interface Question {
  id: string;
  question: string;
  keyword?: string;
  status: string;
  cluster_name?: string;
}

interface ArticlePreview {
  id: string;
  title: string;
  content?: string;
  wordCount?: number;
  status: string;
}

interface OutlineItem {
  heading: string;
  subpoints?: string[];
}

export default function GeneratePage() {
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([]);
  const [generatingQuestions, setGeneratingQuestions] = useState<Question[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Individual generate
  const [questionSearch, setQuestionSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Question[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [generatingSingle, setGeneratingSingle] = useState(false);
  const [articleResult, setArticleResult] = useState<ArticlePreview | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Outline generator
  const [outlineKeyword, setOutlineKeyword] = useState('');
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [outline, setOutline] = useState<OutlineItem[] | null>(null);
  const [outlineRaw, setOutlineRaw] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true);
      try {
        const [pendingData, generatingData] = await Promise.all([
          api('/api/seo/questions?status=PENDING&perPage=100').catch(() => ({ data: { items: [] } })),
          api('/api/seo/questions?status=GENERATING&perPage=100').catch(() => ({ data: { items: [] } })),
        ]);
        // Backend returns { success, data: { items: [...], total, page, perPage } }
        const pd = pendingData?.data ?? pendingData;
        const gd = generatingData?.data ?? generatingData;
        const pList = pd?.items ?? (Array.isArray(pd) ? pd : []);
        const gList = gd?.items ?? (Array.isArray(gd) ? gd : []);
        setPendingQuestions(pList);
        setGeneratingQuestions(gList);
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
  }, []);

  useEffect(() => {
    if (!questionSearch.trim()) {
      setSearchResults([]);
      return;
    }
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const raw = await api(`/api/seo/questions?search=${encodeURIComponent(questionSearch)}&perPage=10`);
        // Backend returns { success, data: { items: [...] } }
        const data = raw?.data ?? raw;
        const list = data?.items ?? (Array.isArray(data) ? data : []);
        setSearchResults(list);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [questionSearch]);

  async function handleGenerateAll() {
    if (pendingQuestions.length === 0) return;
    setGeneratingAll(true);
    try {
      const questionIds = pendingQuestions.map((q) => q.id);
      const raw = await api('/api/seo/generate/generate-batch', {
        method: 'POST',
        body: JSON.stringify({ questionIds })
      });
      // Backend returns { success, data: { queued, jobIds } }
      const data = raw?.data ?? raw;
      const count = data.queued ?? data.count ?? questionIds.length;
      showToast(`${count} articles queued for generation`);
      setPendingQuestions([]);
      setGeneratingQuestions((prev) => [...prev, ...pendingQuestions]);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to queue generation');
    } finally {
      setGeneratingAll(false);
    }
  }

  async function handleGenerateSingle() {
    if (!selectedQuestion) return;
    setGeneratingSingle(true);
    setArticleResult(null);
    try {
      const raw = await api('/api/seo/generate/generate-single', {
        method: 'POST',
        body: JSON.stringify({ questionId: selectedQuestion.id })
      });
      // Backend returns { success, data: { title, metaDescription, content, wordCount, articleId } }
      const data = raw?.data ?? raw;
      const article: ArticlePreview = { id: data.articleId ?? data.id, title: data.title, content: data.content, wordCount: data.wordCount, status: 'DRAFT' };
      setArticleResult(article);
      showToast('Article generated');
      // Remove from pending if it was there
      setPendingQuestions((prev) => prev.filter((q) => q.id !== selectedQuestion.id));
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGeneratingSingle(false);
    }
  }

  async function handleGenerateOutline() {
    if (!outlineKeyword.trim()) return;
    setGeneratingOutline(true);
    setOutline(null);
    setOutlineRaw(null);
    try {
      const raw = await api('/api/seo/generate/generate-outline', {
        method: 'POST',
        // Backend requires both keyword and questionText
        body: JSON.stringify({ keyword: outlineKeyword.trim(), questionText: outlineKeyword.trim() })
      });
      // Backend returns { success, data: { title, metaDescription, outline: string[] } }
      const data = raw?.data ?? raw;
      // Try structured first, fall back to raw
      if (data.outline && Array.isArray(data.outline)) {
        // Backend returns string[] — convert to OutlineItem[]
        setOutline(data.outline.map((s: string | OutlineItem) => typeof s === 'string' ? { heading: s } : s));
      } else if (typeof data.outline === 'string') {
        setOutlineRaw(data.outline);
      } else if (data.sections && Array.isArray(data.sections)) {
        setOutline(data.sections);
      } else {
        setOutlineRaw(JSON.stringify(data, null, 2));
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to generate outline');
    } finally {
      setGeneratingOutline(false);
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-white/[0.03] text-muted-foreground border-white/[0.06]',
    GENERATING: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    ARTICLE_DRAFTED: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    PUBLISHED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
  };

  return (
    <div className="min-h-screen bg-card text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Content Generation</h1>
          <p className="text-muted-foreground leading-relaxed text-sm mt-1.5">Control center for generating SEO articles at scale</p>
        </div>

        {/* Stats + Generate All */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">Pending</p>
            {loadingStats ? (
              <LoadingGlobe size="sm" />
            ) : (
              <p className="text-3xl font-semibold tracking-tight text-foreground">{pendingQuestions.length}</p>
            )}
            <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">questions awaiting generation</p>
          </div>
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">Generating</p>
            {loadingStats ? (
              <LoadingGlobe size="sm" />
            ) : (
              <p className="text-3xl font-semibold tracking-tight text-amber-400">{generatingQuestions.length}</p>
            )}
            <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">in progress right now</p>
          </div>
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5">Batch Generate</p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                Queue all {pendingQuestions.length} pending questions for generation
              </p>
            </div>
            <button
              onClick={handleGenerateAll}
              disabled={generatingAll || loadingStats || pendingQuestions.length === 0}
              className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:hover:bg-primary text-white rounded-xl text-sm font-medium transition-all duration-200"
            >
              {generatingAll ? (
                <>
                  <LoadingGlobe size="sm" />
                  Queueing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate All Pending
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generating queue preview */}
        {generatingQuestions.length > 0 && (
          <div className="bg-amber-500/[0.06] border border-amber-500/15 rounded-2xl backdrop-blur-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <LoadingGlobe size="sm" />
              <h2 className="text-sm font-medium text-amber-300">Currently Generating ({generatingQuestions.length})</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {generatingQuestions.slice(0, 12).map((q) => (
                <span key={q.id} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/15 text-amber-300 rounded-full text-xs truncate max-w-xs">
                  {q.question}
                </span>
              ))}
              {generatingQuestions.length > 12 && (
                <span className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] text-muted-foreground rounded-full text-xs">
                  +{generatingQuestions.length - 12} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Individual generate */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04]">
              <h2 className="tracking-tight font-semibold text-foreground">Generate Single Article</h2>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Search for a question and generate immediately</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-sm transition-all duration-200"
                />
              </div>

              {/* Search results */}
              {(searching || searchResults.length > 0) && (
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {searching ? (
                    <div className="flex items-center justify-center py-6">
                      <LoadingGlobe size="sm" />
                    </div>
                  ) : (
                    searchResults.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          setSelectedQuestion(q);
                          setQuestionSearch('');
                          setSearchResults([]);
                          setArticleResult(null);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/[0.04] transition-all duration-200 border-b border-white/[0.03] last:border-0"
                      >
                        <p className="text-sm text-foreground truncate">{q.question}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {q.keyword && <span className="text-xs text-muted-foreground">{q.keyword}</span>}
                          <span className={`px-1.5 py-0.5 rounded-md text-xs border ${statusColors[q.status] ?? 'bg-white/[0.03] text-muted-foreground border-white/[0.06]'}`}>
                            {q.status}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Selected question */}
              {selectedQuestion && (
                <div className="bg-primary/80/[0.08] border border-primary/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-foreground font-medium">{selectedQuestion.question}</p>
                      {selectedQuestion.keyword && (
                        <p className="text-xs text-muted-foreground mt-0.5">{selectedQuestion.keyword}</p>
                      )}
                    </div>
                    <button
                      onClick={() => { setSelectedQuestion(null); setArticleResult(null); }}
                      className="text-muted-foreground hover:text-foreground text-xs flex-shrink-0 transition-colors duration-150"
                    >
                      Clear
                    </button>
                  </div>
                  <button
                    onClick={handleGenerateSingle}
                    disabled={generatingSingle}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-all duration-200"
                  >
                    {generatingSingle ? (
                      <>
                        <LoadingGlobe size="sm" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Generate Now
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Article result preview */}
              {articleResult && (
                <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-300">Article Generated</span>
                  </div>
                  <p className="text-sm text-foreground font-medium">{articleResult.title}</p>
                  {articleResult.wordCount && (
                    <p className="text-xs text-muted-foreground">{articleResult.wordCount.toLocaleString()} words</p>
                  )}
                  {articleResult.content && (
                    <p className="text-xs text-muted-foreground line-clamp-3 mt-2">{articleResult.content.substring(0, 200)}...</p>
                  )}
                  <a
                    href={`/dashboard/seo/articles/${articleResult.id}/edit`}
                    className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary hover:text-primary/80 transition-colors duration-150"
                  >
                    Open in Editor
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Outline generator */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04]">
              <h2 className="tracking-tight font-semibold text-foreground">Outline Generator</h2>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Generate an article outline from a keyword</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={outlineKeyword}
                  onChange={(e) => setOutlineKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !generatingOutline && handleGenerateOutline()}
                  placeholder="Enter a keyword..."
                  className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-sm transition-all duration-200"
                />
                <button
                  onClick={handleGenerateOutline}
                  disabled={generatingOutline || !outlineKeyword.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap"
                >
                  {generatingOutline ? (
                    <LoadingGlobe size="sm" />
                  ) : (
                    <LayoutList className="w-4 h-4" />
                  )}
                  {generatingOutline ? 'Generating...' : 'Generate'}
                </button>
              </div>

              {/* Outline results */}
              {outline && outline.length > 0 && (
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-2 max-h-96 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <List className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Article Outline</span>
                  </div>
                  {outline.map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-primary font-semibold text-sm min-w-[20px]">{i + 1}.</span>
                        <p className="text-sm text-foreground font-medium">{item.heading ?? item}</p>
                      </div>
                      {item.subpoints && item.subpoints.length > 0 && (
                        <ul className="ml-6 space-y-1">
                          {item.subpoints.map((sp, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className="text-muted-foreground mt-0.5">•</span>
                              {sp}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {outlineRaw && (
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 max-h-96 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <List className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Article Outline</span>
                  </div>
                  <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">{outlineRaw}</pre>
                </div>
              )}

              {!outline && !outlineRaw && !generatingOutline && (
                <div className="bg-white/[0.02] border border-dashed border-white/[0.06] rounded-xl p-8 text-center">
                  <LayoutList className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Enter a keyword and generate an outline</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-white/[0.06] border border-white/[0.08] rounded-2xl backdrop-blur-2xl shadow-2xl text-sm text-foreground flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}
