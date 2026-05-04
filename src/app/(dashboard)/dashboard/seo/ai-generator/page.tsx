'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Sparkles, History, Copy, Save, Send, RefreshCw, Wand2,
  Check, X, FileText, BookOpen, ShoppingBag,
  Layout, HelpCircle, ListChecks, Link2, Megaphone,
  Clock, BarChart3, Eye, ArrowUpRight,
  Type, AlignLeft, CheckSquare, Globe, Zap, TrendingUp
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ContentType = 'blog_post' | 'pillar_page' | 'product_description' | 'landing_page' | 'faq' | 'how_to_guide';
type Tone = 'professional' | 'casual' | 'technical' | 'persuasive' | 'educational';
type GenerationStatus = 'draft' | 'published' | 'archived';

interface IncludeOptions {
  metaTitle: boolean;
  metaDescription: boolean;
  faqSection: boolean;
  internalLinks: boolean;
  cta: boolean;
}

interface GenerationResult {
  id: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  suggestedLinks: { text: string; url: string }[];
  readabilityScore: number;
  seoScore: number;
  keywordDensity: number;
  headingCount: number;
  wordCount: number;
  timestamp: number;
}

interface HistoryEntry {
  id: string;
  title: string;
  type: ContentType;
  date: string;
  wordCount: number;
  seoScore: number;
  status: GenerationStatus;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CONTENT_TYPES: { value: ContentType; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'blog_post', label: 'Blog Post', icon: FileText },
  { value: 'pillar_page', label: 'Pillar Page', icon: BookOpen },
  { value: 'product_description', label: 'Product Description', icon: ShoppingBag },
  { value: 'landing_page', label: 'Landing Page Copy', icon: Layout },
  { value: 'faq', label: 'FAQ', icon: HelpCircle },
  { value: 'how_to_guide', label: 'How-To Guide', icon: ListChecks },
];

const TONES: { value: Tone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'technical', label: 'Technical' },
  { value: 'persuasive', label: 'Persuasive' },
  { value: 'educational', label: 'Educational' },
];

const STATUS_COLORS: Record<GenerationStatus, string> = {
  draft: 'bg-yellow-500/20 text-yellow-400',
  published: 'bg-green-500/20 text-green-400',
  archived: 'bg-muted text-muted-foreground',
};

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_HISTORY: HistoryEntry[] = [
  { id: '1', title: 'Ultimate Guide to Credit Repair in 2026', type: 'pillar_page', date: '2026-03-15', wordCount: 4200, seoScore: 94, status: 'published' },
  { id: '2', title: '10 Ways to Boost Your Credit Score Fast', type: 'blog_post', date: '2026-03-14', wordCount: 1800, seoScore: 88, status: 'published' },
  { id: '3', title: 'Business Funding FAQ', type: 'faq', date: '2026-03-13', wordCount: 1200, seoScore: 82, status: 'draft' },
  { id: '4', title: 'How to Apply for SBA Loans', type: 'how_to_guide', date: '2026-03-12', wordCount: 2400, seoScore: 91, status: 'published' },
  { id: '5', title: 'Premium Credit Monitoring Service', type: 'product_description', date: '2026-03-11', wordCount: 800, seoScore: 76, status: 'draft' },
];

const MOCK_CONTENT = `# The Ultimate Guide to Credit Repair in 2026

Credit repair is a critical step for anyone looking to improve their financial standing. Whether you're recovering from past mistakes or building credit for the first time, this comprehensive guide will walk you through everything you need to know.

## Why Credit Repair Matters

Your credit score affects nearly every financial decision in your life. From mortgage rates to insurance premiums, a strong credit score can save you thousands of dollars annually.

### The Impact of Bad Credit

- **Higher interest rates** on loans and credit cards
- **Difficulty renting** apartments or homes
- **Higher insurance premiums** across all policy types
- **Limited employment opportunities** in finance and government sectors

## Step 1: Pull Your Credit Reports

The first step in any credit repair journey is understanding where you stand. You're entitled to a free credit report from each of the three major bureaus annually.

### The Three Major Credit Bureaus

1. **Equifax** — One of the oldest credit bureaus, founded in 1899
2. **Experian** — Headquartered in Dublin, Ireland
3. **TransUnion** — Known for their consumer-facing products

## Step 2: Identify Errors and Disputes

Studies show that **1 in 5 consumers** have errors on their credit reports. These errors can significantly impact your score.

### Common Credit Report Errors

- Accounts that don't belong to you
- Incorrect payment history
- Wrong personal information
- Duplicate accounts
- Outdated negative information

## Step 3: Build Positive Credit History

While disputing errors, simultaneously work on building positive credit history.

> "The best time to start building credit was yesterday. The second best time is today."

### Strategies for Building Credit

- **Secured credit cards** — Start with a small deposit
- **Credit builder loans** — Available at most credit unions
- **Authorized user status** — Leverage someone else's good credit
- **Rent reporting** — Services that report rent payments to bureaus

## Frequently Asked Questions

**How long does credit repair take?**
Most credit repair processes take 3-6 months, though complex cases can take longer.

**Can I repair my credit myself?**
Absolutely. While professional services exist, you have the legal right to dispute errors on your own.

**What's a good credit score?**
Generally, scores above 700 are considered good, while scores above 750 are excellent.

---

*Ready to start your credit repair journey? [Contact our team](/contact) for a free consultation.*`;

/* ------------------------------------------------------------------ */
/*  Helper Components                                                  */
/* ------------------------------------------------------------------ */

function ScoreBadge({ label, score, icon: Icon }: { label: string; score: number; icon: React.ComponentType<any> }) {
  const color = score >= 90 ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                score >= 70 ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                'text-red-400 border-red-500/30 bg-red-500/10';
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">{label}</span>
      <span className="text-sm font-bold ml-auto">{score}/100</span>
    </div>
  );
}

function TagInput({ tags, onAdd, onRemove, max = 10 }: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  max?: number;
}) {
  const [value, setValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = value.trim().replace(/,/g, '');
      if (trimmed && tags.length < max && !tags.includes(trimmed)) {
        onAdd(trimmed);
        setValue('');
      }
    }
    if (e.key === 'Backspace' && !value && tags.length > 0) {
      onRemove(tags.length - 1);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-2 bg-card border border-border rounded-lg min-h-[42px] focus-within:border-red-500/50 transition-colors">
      {tags.map((tag, i) => (
        <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-red-500/15 text-red-400 rounded text-xs font-medium">
          {tag}
          <button onClick={() => onRemove(i)} className="hover:text-red-300 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {tags.length < max && (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Type keyword and press Enter...' : ''}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      )}
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="prose prose-invert prose-sm max-w-none space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mt-6 mb-3">{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold text-white mt-5 mb-2">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-medium text-foreground mt-4 mb-2">{line.slice(4)}</h3>;
        if (line.startsWith('> ')) return <blockquote key={i} className="border-l-2 border-red-500/50 pl-4 italic text-muted-foreground my-3">{line.slice(2)}</blockquote>;
        if (line.startsWith('---')) return <hr key={i} className="border-border my-4" />;
        if (line.startsWith('- **')) {
          const match = line.match(/^- \*\*(.+?)\*\*(.*)$/);
          if (match) return <li key={i} className="list-disc ml-4 text-foreground"><strong className="text-white">{match[1]}</strong>{match[2]}</li>;
        }
        if (line.startsWith('- ')) return <li key={i} className="list-disc ml-4 text-foreground">{line.slice(2)}</li>;
        if (/^\d+\.\s\*\*/.test(line)) {
          const match = line.match(/^\d+\.\s\*\*(.+?)\*\*(.*)$/);
          if (match) return <li key={i} className="list-decimal ml-4 text-foreground"><strong className="text-white">{match[1]}</strong>{match[2]}</li>;
        }
        if (/^\d+\.\s/.test(line)) return <li key={i} className="list-decimal ml-4 text-foreground">{line.replace(/^\d+\.\s/, '')}</li>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-white">{line.slice(2, -2)}</p>;
        if (line.startsWith('*') && line.endsWith('*')) return <p key={i} className="italic text-muted-foreground">{line.slice(1, -1)}</p>;
        if (line.trim() === '') return <div key={i} className="h-2" />;
        return <p key={i} className="text-foreground leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function AIGeneratorPage() {
  // Input state
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState<ContentType>('blog_post');
  const [tone, setTone] = useState<Tone>('professional');
  const [wordCount, setWordCount] = useState(2000);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [includes, setIncludes] = useState<IncludeOptions>({
    metaTitle: true,
    metaDescription: true,
    faqSection: false,
    internalLinks: true,
    cta: true,
  });
  const [competitorUrl, setCompetitorUrl] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [versionHistory, setVersionHistory] = useState<GenerationResult[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [recentGenerations] = useState<HistoryEntry[]>(MOCK_HISTORY);
  const [creditsRemaining] = useState(847);

  const outputRef = useRef<HTMLDivElement>(null);

  // Simulate generation
  const handleGenerate = useCallback(() => {
    if (!topic.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      const result: GenerationResult = {
        id: Math.random().toString(36).slice(2, 10),
        content: MOCK_CONTENT,
        metaTitle: `${topic} - Complete Guide for 2026 | Memelli`,
        metaDescription: `Discover everything you need to know about ${topic.toLowerCase()}. Expert strategies, actionable tips, and proven methods to achieve your goals. Updated for 2026.`,
        suggestedLinks: [
          { text: 'Credit Score Basics', url: '/blog/credit-score-basics' },
          { text: 'Business Funding Options', url: '/services/business-funding' },
          { text: 'Free Consultation', url: '/contact' },
          { text: 'Credit Monitoring Tools', url: '/tools/credit-monitoring' },
        ],
        readabilityScore: 87,
        seoScore: 92,
        keywordDensity: 2.4,
        headingCount: 8,
        wordCount: MOCK_CONTENT.split(/\s+/).length,
        timestamp: Date.now(),
      };

      setGenerationResult(result);
      setVersionHistory(prev => [result, ...prev].slice(0, 5));
      setSelectedVersion(0);
      setIsGenerating(false);

      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 3000);
  }, [topic]);

  const handleCopy = useCallback(() => {
    if (!generationResult) return;
    navigator.clipboard.writeText(generationResult.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generationResult]);

  const handleSave = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleImprove = useCallback(() => {
    if (!generationResult) return;
    setIsGenerating(true);
    setTimeout(() => {
      const improved: GenerationResult = {
        ...generationResult,
        id: Math.random().toString(36).slice(2, 10),
        seoScore: Math.min(100, generationResult.seoScore + 4),
        readabilityScore: Math.min(100, generationResult.readabilityScore + 3),
        timestamp: Date.now(),
      };
      setGenerationResult(improved);
      setVersionHistory(prev => [improved, ...prev].slice(0, 5));
      setSelectedVersion(0);
      setIsGenerating(false);
    }, 2500);
  }, [generationResult]);

  const handleVersionSelect = useCallback((index: number) => {
    setSelectedVersion(index);
    setGenerationResult(versionHistory[index]);
  }, [versionHistory]);

  const toggleInclude = (key: keyof IncludeOptions) => {
    setIncludes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-card text-foreground">
      {/* ---- Top Bar ---- */}
      <div className="sticky top-0 z-30 bg-card backdrop-blur-md border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AI Content Generator</h1>
              <p className="text-xs text-muted-foreground">SEO-optimized content creation studio</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-foreground">
                <span className="font-semibold text-yellow-400">{creditsRemaining}</span> credits remaining
              </span>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Generation History</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* ---- Two-Column Layout ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ======== LEFT — Input Panel ======== */}
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-xl p-5 space-y-5">
              {/* Topic / Keyword */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Topic / Primary Keyword</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Credit repair strategies for beginners"
                  className="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-red-500/50 transition-colors"
                />
              </div>

              {/* Content Type Selector */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Content Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {CONTENT_TYPES.map((ct) => {
                    const Icon = ct.icon;
                    const active = contentType === ct.value;
                    return (
                      <button
                        key={ct.value}
                        onClick={() => setContentType(ct.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          active
                            ? 'bg-red-500/15 border-red-500/40 text-red-400'
                            : 'bg-card border-border text-muted-foreground hover:border-border hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {ct.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tone Selector */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        tone === t.value
                          ? 'bg-red-500/15 border border-red-500/40 text-red-400'
                          : 'bg-card border border-border text-muted-foreground hover:border-border'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Word Count Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">Word Count</label>
                  <span className="text-sm font-mono text-red-400">{wordCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">500</span>
                  <input
                    type="range"
                    min={500}
                    max={5000}
                    step={100}
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-4
                      [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-red-500
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:shadow-red-500/30
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:transition-transform
                      [&::-webkit-slider-thumb]:hover:scale-110"
                  />
                  <span className="text-xs text-muted-foreground">5,000</span>
                </div>
              </div>

              {/* Target Keywords */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">Target Keywords</label>
                  <span className="text-xs text-muted-foreground">{keywords.length}/10</span>
                </div>
                <TagInput
                  tags={keywords}
                  onAdd={(tag) => setKeywords(prev => [...prev, tag])}
                  onRemove={(i) => setKeywords(prev => prev.filter((_, idx) => idx !== i))}
                />
              </div>

              {/* Include Checklist */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Include in Output</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'metaTitle' as const, label: 'Meta Title', icon: Type },
                    { key: 'metaDescription' as const, label: 'Meta Description', icon: AlignLeft },
                    { key: 'faqSection' as const, label: 'FAQ Section', icon: HelpCircle },
                    { key: 'internalLinks' as const, label: 'Internal Links', icon: Link2 },
                    { key: 'cta' as const, label: 'Call to Action', icon: Megaphone },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => toggleInclude(key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                        includes[key]
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : 'bg-card border-border text-muted-foreground hover:border-border'
                      }`}
                    >
                      {includes[key] ? (
                        <CheckSquare className="w-3.5 h-3.5" />
                      ) : (
                        <div className="w-3.5 h-3.5 border border-border rounded-sm" />
                      )}
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Competitor URL */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Competitor URL <span className="text-muted-foreground">(optional)</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={competitorUrl}
                    onChange={(e) => setCompetitorUrl(e.target.value)}
                    placeholder="https://competitor.com/their-article"
                    className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!topic.trim() || isGenerating}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  !topic.trim() || isGenerating
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 animate-pulse hover:animate-none'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Content
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ======== RIGHT — Output Panel ======== */}
          <div className="space-y-5" ref={outputRef}>
            {!generationResult && !isGenerating ? (
              <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center justify-center text-center min-h-[600px]">
                <div className="p-4 bg-muted rounded-2xl mb-4">
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Ready to Generate</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Fill in the details on the left and hit Generate to create SEO-optimized content powered by AI.
                </p>
              </div>
            ) : isGenerating && !generationResult ? (
              <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center justify-center text-center min-h-[600px]">
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-2 border-red-500/20 rounded-full animate-ping absolute inset-0" />
                  <div className="w-16 h-16 border-2 border-red-500/40 border-t-red-500 rounded-full animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Generating Your Content</h3>
                <p className="text-sm text-muted-foreground">AI is crafting SEO-optimized content for &ldquo;{topic}&rdquo;</p>
                <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  Analyzing keywords, structuring headings, optimizing for search...
                </div>
              </div>
            ) : generationResult ? (
              <>
                {/* Content Preview */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-medium text-foreground">Content Preview</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{generationResult.wordCount} words</span>
                  </div>
                  <div className="p-5 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    <MarkdownRenderer content={generationResult.content} />
                  </div>
                </div>

                {/* Meta Title + Description */}
                {includes.metaTitle && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Type className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Meta Title</span>
                      <span className={`text-xs ml-auto ${generationResult.metaTitle.length <= 60 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {generationResult.metaTitle.length}/60
                      </span>
                    </div>
                    <p className="text-sm text-blue-400 font-medium">{generationResult.metaTitle}</p>
                  </div>
                )}

                {includes.metaDescription && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlignLeft className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Meta Description</span>
                      <span className={`text-xs ml-auto ${generationResult.metaDescription.length <= 160 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {generationResult.metaDescription.length}/160
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{generationResult.metaDescription}</p>
                  </div>
                )}

                {/* Suggested Internal Links */}
                {includes.internalLinks && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Link2 className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Suggested Internal Links</span>
                    </div>
                    <div className="space-y-2">
                      {generationResult.suggestedLinks.map((link, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 bg-muted rounded-lg">
                          <span className="text-sm text-foreground">{link.text}</span>
                          <span className="text-xs text-primary flex items-center gap-1">
                            {link.url}
                            <ArrowUpRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score Badges */}
                <div className="grid grid-cols-2 gap-3">
                  <ScoreBadge label="Readability" score={generationResult.readabilityScore} icon={Eye} />
                  <ScoreBadge label="SEO Score" score={generationResult.seoScore} icon={TrendingUp} />
                </div>

                {/* SEO Details */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">SEO Analysis</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-lg font-bold text-orange-400">{generationResult.keywordDensity}%</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Keyword Density</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-lg font-bold text-blue-400">{generationResult.headingCount}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Headings</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-lg font-bold text-green-400">{includes.metaTitle && includes.metaDescription ? '2/2' : includes.metaTitle || includes.metaDescription ? '1/2' : '0/2'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Meta Tags</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {saved ? <Check className="w-4 h-4 text-green-400" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Saved!' : 'Save to Drafts'}
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm text-white font-medium transition-colors">
                    <Send className="w-4 h-4" />
                    Publish
                  </button>
                </div>

                {/* Regenerate + Improve */}
                <div className="flex gap-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                  <button
                    onClick={handleImprove}
                    disabled={isGenerating}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <Wand2 className="w-4 h-4" />
                    Improve
                  </button>
                </div>

                {/* Version History */}
                {versionHistory.length > 1 && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Version History</span>
                      <span className="text-xs text-muted-foreground ml-auto">{versionHistory.length} versions</span>
                    </div>
                    <div className="space-y-1.5">
                      {versionHistory.map((v, i) => (
                        <button
                          key={v.id}
                          onClick={() => handleVersionSelect(i)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                            selectedVersion === i
                              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                              : 'bg-muted text-muted-foreground hover:bg-muted border border-transparent'
                          }`}
                        >
                          <span>Version {versionHistory.length - i}</span>
                          <div className="flex items-center gap-3">
                            <span>SEO: {v.seoScore}</span>
                            <span>{new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* ======== Bottom — Recent Generations Table ======== */}
        <div className="mt-8">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Recent Generations</span>
              </div>
              <span className="text-xs text-muted-foreground">{recentGenerations.length} items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Words</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">SEO Score</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentGenerations.map((entry) => (
                    <tr key={entry.id} className="border-b border-border hover:bg-muted transition-colors cursor-pointer">
                      <td className="px-5 py-3">
                        <span className="text-foreground font-medium">{entry.title}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-muted-foreground text-xs">
                          {CONTENT_TYPES.find(ct => ct.value === entry.type)?.label || entry.type}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-muted-foreground text-xs">{entry.date}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-muted-foreground text-xs font-mono">{entry.wordCount.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-xs font-bold ${
                          entry.seoScore >= 90 ? 'text-green-400' :
                          entry.seoScore >= 70 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {entry.seoScore}/100
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[entry.status]}`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
