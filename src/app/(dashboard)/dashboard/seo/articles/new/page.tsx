'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { API_URL as API } from '@/lib/config';

async function api(path: string, opts?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface Cluster {
  id: string;
  name: string;
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

const STATUSES = ['DRAFT', 'READY', 'PUBLISHED'];

export default function NewArticlePage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [content, setContent] = useState('');
  const [clusterId, setClusterId] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api('/api/seo/clusters?perPage=100').then(raw => {
      // Backend returns { success, data: [...] }
      const d = raw?.data ?? raw;
      const list: Cluster[] = Array.isArray(d) ? d : [];
      setClusters(list);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!slugManual) {
      setSlug(slugify(title));
    }
  }, [title, slugManual]);

  const wordCount = countWords(content);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const raw = await api('/api/seo/articles', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          slug: slug || slugify(title),
          keyword: keyword.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
          content: content.trim() || undefined,
          clusterId: clusterId || undefined,
          status,
        }),
      });
      // Backend returns { success, data: article }
      const data = raw?.data ?? raw;
      const id = data.id ?? data.article?.id;
      if (id) {
        router.push(`/dashboard/seo/articles/${id}/edit`);
      } else {
        router.push('/dashboard/seo/articles');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create article');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-card text-foreground p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/seo/articles" className="p-1.5 hover:bg-white/[0.06] rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">New Article</h1>
            <p className="text-muted-foreground leading-relaxed text-sm mt-0.5">Create an article manually</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {/* Title */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 space-y-5">
            <h2 className="font-semibold text-foreground flex items-center gap-2 tracking-tight">
              <FileText className="w-4 h-4 text-primary" /> Article Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="How to Repair Your Credit in 6 Months"
                required
                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/30 transition-all duration-200 placeholder-muted-foreground"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-foreground">Slug</label>
                <button
                  type="button"
                  onClick={() => setSlugManual(v => !v)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {slugManual ? 'Auto-generate' : 'Edit manually'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground flex-shrink-0">/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={e => { setSlugManual(true); setSlug(e.target.value); }}
                  placeholder="how-to-repair-your-credit"
                  className={`flex-1 px-3 py-2.5 bg-white/[0.03] border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/30 transition-all duration-200 placeholder-muted-foreground ${
                    slugManual ? 'border-white/[0.08]' : 'border-white/[0.06]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Target Keyword</label>
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="credit repair tips"
                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/30 transition-all duration-200 placeholder-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Meta Description</label>
              <textarea
                value={metaDescription}
                onChange={e => setMetaDescription(e.target.value)}
                placeholder="A brief description for search results (150-160 characters)"
                rows={2}
                maxLength={160}
                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/30 transition-all duration-200 placeholder-muted-foreground resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">{metaDescription.length}/160 characters</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Cluster (optional)</label>
                <select
                  value={clusterId}
                  onChange={e => setClusterId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/30 transition-all duration-200"
                >
                  <option value="">— No cluster —</option>
                  {clusters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/30 transition-all duration-200"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
              <h2 className="font-semibold text-foreground tracking-tight">Content</h2>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-lg border ${
                wordCount < 300 ? 'bg-white/[0.04] text-muted-foreground border-white/[0.06]'
                : wordCount < 800 ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20'
                : 'bg-green-500/10 text-green-300 border-green-500/20'
              }`}>
                {wordCount.toLocaleString()} words
              </span>
            </div>
            <textarea
              ref={contentRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your article content here (Markdown supported)..."
              rows={20}
              className="w-full px-5 py-4 bg-transparent text-foreground text-sm focus:outline-none placeholder-muted-foreground resize-none font-mono leading-relaxed"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-primary/10 border border-primary/20 rounded-2xl text-sm text-primary/80">{error}</div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pb-8">
            <Link
              href="/dashboard/seo/articles"
              className="flex-1 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.04] border border-white/[0.04] rounded-xl text-sm text-muted-foreground leading-relaxed transition-all duration-200 text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary disabled:opacity-50 text-white rounded-xl text-sm font-semibold tracking-tight transition-all duration-200"
            >
              {submitting ? 'Creating...' : 'Create Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
