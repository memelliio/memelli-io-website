'use client';

import { useEffect, useState, useCallback } from 'react';
import { Save, CheckCircle, AlertCircle, Zap } from 'lucide-react';
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

interface Settings {
  siteUrl?: string;
  site_url?: string;
  siteName?: string;
  site_name?: string;
  defaultMetaTemplate?: string;
  default_meta_template?: string;
  defaultWordCount?: number;
  default_word_count?: number;
  defaultArticleStatus?: string;
  default_article_status?: string;
  includeFaq?: boolean;
  include_faq?: boolean;
  includeConclusion?: boolean;
  include_conclusion?: boolean;
  indexNowKey?: string;
  index_now_key?: string;
}

export default function SEOSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [siteUrl, setSiteUrl] = useState('');
  const [siteName, setSiteName] = useState('');
  const [metaTemplate, setMetaTemplate] = useState('{{keyword}} — Expert Guide | {{site_name}}');
  const [wordCount, setWordCount] = useState(1200);
  const [defaultStatus, setDefaultStatus] = useState('DRAFT');
  const [includeFaq, setIncludeFaq] = useState(true);
  const [includeConclusion, setIncludeConclusion] = useState(true);
  const [indexNowKey, setIndexNowKey] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await api('/api/tenants/me');
      const data: Settings = raw?.data ?? raw;
      setSiteUrl(data.siteUrl ?? data.site_url ?? '');
      setSiteName(data.siteName ?? data.site_name ?? '');
      setMetaTemplate(data.defaultMetaTemplate ?? data.default_meta_template ?? '{{keyword}} — Expert Guide | {{site_name}}');
      setWordCount(data.defaultWordCount ?? data.default_word_count ?? 1200);
      setDefaultStatus(data.defaultArticleStatus ?? data.default_article_status ?? 'DRAFT');
      setIncludeFaq(data.includeFaq ?? data.include_faq ?? true);
      setIncludeConclusion(data.includeConclusion ?? data.include_conclusion ?? true);
      setIndexNowKey(data.indexNowKey ?? data.index_now_key ?? '');
    } catch {
      // non-fatal — user can still edit
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      await api('/api/tenants/me', {
        method: 'PATCH',
        body: JSON.stringify({
          siteUrl,
          siteName,
          defaultMetaTemplate: metaTemplate,
          defaultWordCount: wordCount,
          defaultArticleStatus: defaultStatus,
          includeFaq,
          includeConclusion,
        }),
      });
      showToast('Settings saved');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function testIndexNow() {
    if (!siteUrl) {
      setTestResult({ success: false, message: 'Set a site URL first.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const data = await api('/api/seo/indexnow/test', {
        method: 'POST',
        body: JSON.stringify({ url: siteUrl }),
      });
      setTestResult({ success: true, message: data.message ?? 'IndexNow test submitted successfully.' });
    } catch (e) {
      setTestResult({ success: false, message: e instanceof Error ? e.message : 'Test failed' });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card text-foreground p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">SEO Settings</h1>
            <p className="text-muted-foreground text-sm mt-1.5">Configure your SEO engine defaults</p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-40 rounded-xl text-sm text-white font-medium transition-all duration-200"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Site Settings */}
        <section className="bg-white/[0.03] border border-white/[0.04] rounded-2xl backdrop-blur-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <h2 className="font-medium tracking-tight text-white">Site Settings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Used for canonical URLs, sitemaps, and meta tags</p>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Site URL</label>
              <input
                type="url"
                value={siteUrl}
                onChange={e => setSiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 placeholder-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">Used to generate canonical URLs and sitemap entries</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Site Name</label>
              <input
                type="text"
                value={siteName}
                onChange={e => setSiteName(e.target.value)}
                placeholder="My Brand"
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 placeholder-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Default Meta Description Template</label>
              <input
                type="text"
                value={metaTemplate}
                onChange={e => setMetaTemplate(e.target.value)}
                placeholder="{{keyword}} — Expert Guide | {{site_name}}"
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 placeholder-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available variables: <code className="text-muted-foreground">{'{{keyword}}'}</code>, <code className="text-muted-foreground">{'{{site_name}}'}</code>, <code className="text-muted-foreground">{'{{title}}'}</code>
              </p>
              {metaTemplate && (
                <div className="mt-2 px-3 py-2 bg-white/[0.03] border border-white/[0.04] rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                  <p className="text-xs text-foreground">
                    {metaTemplate
                      .replace('{{keyword}}', 'credit repair tips')
                      .replace('{{site_name}}', siteName || 'Your Brand')
                      .replace('{{title}}', 'How to Repair Your Credit')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Content Defaults */}
        <section className="bg-white/[0.03] border border-white/[0.04] rounded-2xl backdrop-blur-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <h2 className="font-medium tracking-tight text-white">Content Defaults</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Default values for newly generated articles</p>
          </div>
          <div className="p-5 space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Default Article Length: <span className="text-primary font-semibold">{wordCount.toLocaleString()} words</span>
              </label>
              <input
                type="range"
                min={800}
                max={2500}
                step={100}
                value={wordCount}
                onChange={e => setWordCount(Number(e.target.value))}
                className="w-full h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>800</span>
                <span>1,200</span>
                <span>1,800</span>
                <span>2,500</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Default Article Status After Generation</label>
              <div className="flex gap-3">
                {['DRAFT', 'READY'].map(status => (
                  <button
                    key={status}
                    onClick={() => setDefaultStatus(status)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                      defaultStatus === status
                        ? 'bg-primary/80/15 border-primary/30 text-primary/80'
                        : 'bg-white/[0.03] border-white/[0.04] text-muted-foreground hover:text-foreground hover:border-white/[0.08]'
                    }`}
                  >
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Content Sections</label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm text-foreground">Include FAQ Section</p>
                  <p className="text-xs text-muted-foreground">Adds a Frequently Asked Questions section to each article</p>
                </div>
                <button
                  onClick={() => setIncludeFaq(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-200 ${includeFaq ? 'bg-primary' : 'bg-white/[0.08]'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${includeFaq ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm text-foreground">Include Conclusion</p>
                  <p className="text-xs text-muted-foreground">Adds a conclusion paragraph to each article</p>
                </div>
                <button
                  onClick={() => setIncludeConclusion(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-200 ${includeConclusion ? 'bg-primary' : 'bg-white/[0.08]'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${includeConclusion ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </label>
            </div>
          </div>
        </section>

        {/* IndexNow */}
        <section className="bg-white/[0.03] border border-white/[0.04] rounded-2xl backdrop-blur-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <h2 className="font-medium tracking-tight text-white">IndexNow</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Instantly notify search engines when you publish new content</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">IndexNow Key</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={indexNowKey}
                  readOnly
                  placeholder="Set INDEXNOW_KEY environment variable"
                  className="flex-1 px-3 py-2.5 bg-white/[0.03] border border-white/[0.04] rounded-xl text-muted-foreground text-sm cursor-not-allowed font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Key is loaded from the <code className="text-muted-foreground">INDEXNOW_KEY</code> environment variable</p>
            </div>
            <div>
              <button
                onClick={testIndexNow}
                disabled={testing}
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] disabled:opacity-40 border border-white/[0.06] rounded-xl text-sm text-foreground transition-all duration-150"
              >
                <Zap className="w-4 h-4" />
                {testing ? 'Testing...' : 'Test IndexNow'}
              </button>
              {testResult && (
                <div className={`mt-3 flex items-start gap-2 px-4 py-3 rounded-xl border text-sm ${
                  testResult.success
                    ? 'bg-emerald-500/[0.06] border-emerald-500/15 text-emerald-300'
                    : 'bg-primary/80/[0.06] border-primary/15 text-primary/80'
                }`}>
                  {testResult.success
                    ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="flex justify-end pb-6">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 rounded-xl text-sm text-white font-medium transition-all duration-200"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl backdrop-blur-2xl shadow-2xl text-sm flex items-center gap-2 border ${
          toast.type === 'success'
            ? 'bg-white/[0.06] border-white/[0.08] text-foreground'
            : 'bg-primary/80/[0.1] border-primary/20 text-foreground'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4 text-emerald-400" />
            : <AlertCircle className="w-4 h-4 text-primary" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
