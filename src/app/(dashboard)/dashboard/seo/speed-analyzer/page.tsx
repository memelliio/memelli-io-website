'use client';

import { useState, useCallback } from 'react';
import {
  Gauge,
  Zap,
  Clock,
  Monitor,
  Smartphone,
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  Globe,
  ArrowRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MetricResult {
  name: string;
  shortName: string;
  value: number;
  unit: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  description: string;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  savings: string;
}

interface PageBreakdown {
  url: string;
  mobileScore: number;
  desktopScore: number;
  fcp: number;
  lcp: number;
  cls: number;
  ttfb: number;
  tbt: number;
}

interface ScanResult {
  id: string;
  url: string;
  timestamp: string;
  mobileScore: number;
  desktopScore: number;
  metrics: {
    mobile: MetricResult[];
    desktop: MetricResult[];
  };
  suggestions: Suggestion[];
  pages: PageBreakdown[];
}

type DeviceTab = 'mobile' | 'desktop';

/* ------------------------------------------------------------------ */
/*  Mock data generator (simulates API response)                       */
/* ------------------------------------------------------------------ */

function generateMetrics(device: DeviceTab): MetricResult[] {
  const isMobile = device === 'mobile';
  const jitter = () => Math.random() * 0.4 + 0.8;

  const fcp = Math.round((isMobile ? 2.1 : 1.2) * jitter() * 100) / 100;
  const lcp = Math.round((isMobile ? 3.4 : 1.8) * jitter() * 100) / 100;
  const cls = Math.round((isMobile ? 0.12 : 0.05) * jitter() * 1000) / 1000;
  const ttfb = Math.round((isMobile ? 0.8 : 0.4) * jitter() * 100) / 100;
  const tbt = Math.round((isMobile ? 450 : 180) * jitter());

  function rate(val: number, good: number, poor: number): 'good' | 'needs-improvement' | 'poor' {
    if (val <= good) return 'good';
    if (val <= poor) return 'needs-improvement';
    return 'poor';
  }

  return [
    { name: 'First Contentful Paint', shortName: 'FCP', value: fcp, unit: 's', rating: rate(fcp, 1.8, 3.0), description: 'Time until first text or image is painted' },
    { name: 'Largest Contentful Paint', shortName: 'LCP', value: lcp, unit: 's', rating: rate(lcp, 2.5, 4.0), description: 'Time until the largest content element is visible' },
    { name: 'Cumulative Layout Shift', shortName: 'CLS', value: cls, unit: '', rating: rate(cls, 0.1, 0.25), description: 'Measures visual stability during page load' },
    { name: 'Time to First Byte', shortName: 'TTFB', value: ttfb, unit: 's', rating: rate(ttfb, 0.8, 1.8), description: 'Server response time for the initial document' },
    { name: 'Total Blocking Time', shortName: 'TBT', value: tbt, unit: 'ms', rating: rate(tbt, 200, 600), description: 'Total time the main thread was blocked' },
  ];
}

function generateSuggestions(): Suggestion[] {
  const pool: Suggestion[] = [
    { id: '1', title: 'Serve images in next-gen formats', description: 'Convert JPEG/PNG images to WebP or AVIF to reduce file size by 25-50%.', priority: 'critical', savings: '~1.2s' },
    { id: '2', title: 'Eliminate render-blocking resources', description: 'Defer non-critical CSS and JavaScript to unblock initial rendering.', priority: 'critical', savings: '~0.8s' },
    { id: '3', title: 'Reduce unused JavaScript', description: 'Remove dead code and split bundles to reduce download and parse time.', priority: 'high', savings: '~0.6s' },
    { id: '4', title: 'Enable text compression', description: 'Use gzip or Brotli compression for text-based resources.', priority: 'high', savings: '~0.4s' },
    { id: '5', title: 'Preconnect to required origins', description: 'Add preconnect hints for third-party domains to reduce DNS lookup time.', priority: 'medium', savings: '~0.3s' },
    { id: '6', title: 'Reduce server response time (TTFB)', description: 'Optimize server config, use CDN, or upgrade hosting for faster responses.', priority: 'medium', savings: '~0.5s' },
    { id: '7', title: 'Properly size images', description: 'Serve correctly-sized images to avoid downloading unnecessary bytes.', priority: 'high', savings: '~0.7s' },
    { id: '8', title: 'Minimize main-thread work', description: 'Reduce JavaScript execution time by optimizing code and deferring tasks.', priority: 'medium', savings: '~0.4s' },
    { id: '9', title: 'Use efficient cache policy', description: 'Set long cache TTL for static assets to reduce repeat requests.', priority: 'low', savings: '~0.2s' },
    { id: '10', title: 'Avoid large layout shifts', description: 'Set explicit width and height on images/videos to prevent CLS.', priority: 'low', savings: 'CLS fix' },
  ];
  const count = 4 + Math.floor(Math.random() * 4);
  return pool.sort(() => Math.random() - 0.5).slice(0, count);
}

function generatePages(baseUrl: string): PageBreakdown[] {
  const paths = ['/', '/about', '/contact', '/blog', '/pricing', '/features'];
  return paths.map(p => {
    const ms = 40 + Math.floor(Math.random() * 55);
    const ds = 60 + Math.floor(Math.random() * 38);
    return {
      url: baseUrl.replace(/\/$/, '') + p,
      mobileScore: ms,
      desktopScore: ds,
      fcp: Math.round((1.0 + Math.random() * 3) * 100) / 100,
      lcp: Math.round((1.5 + Math.random() * 4) * 100) / 100,
      cls: Math.round(Math.random() * 0.3 * 1000) / 1000,
      ttfb: Math.round((0.2 + Math.random() * 1.5) * 100) / 100,
      tbt: Math.round(80 + Math.random() * 600),
    };
  });
}

function computeScore(metrics: MetricResult[]): number {
  const weights: Record<string, number> = { FCP: 10, LCP: 25, CLS: 25, TBT: 30, TTFB: 10 };
  let score = 100;
  for (const m of metrics) {
    const w = weights[m.shortName] ?? 10;
    if (m.rating === 'needs-improvement') score -= w * 0.4;
    if (m.rating === 'poor') score -= w * 0.8;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

/* ------------------------------------------------------------------ */
/*  SVG Gauge Component                                                */
/* ------------------------------------------------------------------ */

function ScoreGauge({ score, size = 180 }: { score: number; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const remaining = circumference - progress;

  let color = '#ef4444'; // red
  let glowColor = 'rgba(239,68,68,0.3)';
  if (score >= 90) { color = '#22c55e'; glowColor = 'rgba(34,197,94,0.3)'; }
  else if (score >= 50) { color = '#f59e0b'; glowColor = 'rgba(245,158,11,0.3)'; }

  const label = score >= 90 ? 'Good' : score >= 50 ? 'Needs Work' : 'Poor';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${remaining}`}
          style={{ filter: `drop-shadow(0 0 8px ${glowColor})`, transition: 'stroke-dasharray 0.8s ease-out' }}
        />
        <text
          x={size / 2}
          y={size / 2 - 6}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize="36"
          fontWeight="700"
          className="transform rotate-90"
          style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}
        >
          {score}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 22}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize="12"
          fontWeight="500"
          className="transform rotate-90"
          style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Metric Card                                                        */
/* ------------------------------------------------------------------ */

function MetricCard({ metric }: { metric: MetricResult }) {
  const colors = {
    good: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    'needs-improvement': { border: 'border-amber-500/20', bg: 'bg-amber-500/5', text: 'text-amber-400', dot: 'bg-amber-400' },
    poor: { border: 'border-red-500/20', bg: 'bg-red-500/5', text: 'text-red-400', dot: 'bg-red-400' },
  };
  const c = colors[metric.rating];

  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">{metric.shortName}</span>
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      </div>
      <p className={`text-2xl font-bold tracking-tight ${c.text}`}>
        {metric.value}{metric.unit}
      </p>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{metric.description}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Priority Badge                                                     */
/* ------------------------------------------------------------------ */

function PriorityBadge({ priority }: { priority: Suggestion['priority'] }) {
  const styles = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${styles[priority]}`}>
      {priority}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Score color helpers                                                 */
/* ------------------------------------------------------------------ */

function scoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(score: number): string {
  if (score >= 90) return 'bg-emerald-500/10';
  if (score >= 50) return 'bg-amber-500/10';
  return 'bg-red-500/10';
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function SpeedAnalyzerPage() {
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [activeResult, setActiveResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [deviceTab, setDeviceTab] = useState<DeviceTab>('mobile');
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  const [pagesExpanded, setPagesExpanded] = useState(false);

  const analyze = useCallback(async () => {
    if (!url.trim()) return;

    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = 'https://' + cleanUrl;

    setAnalyzing(true);

    // Simulate analysis delay
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));

    const mobileMetrics = generateMetrics('mobile');
    const desktopMetrics = generateMetrics('desktop');

    const result: ScanResult = {
      id: Date.now().toString(),
      url: cleanUrl,
      timestamp: new Date().toISOString(),
      mobileScore: computeScore(mobileMetrics),
      desktopScore: computeScore(desktopMetrics),
      metrics: { mobile: mobileMetrics, desktop: desktopMetrics },
      suggestions: generateSuggestions(),
      pages: generatePages(cleanUrl),
    };

    setActiveResult(result);
    setHistory(prev => [result, ...prev].slice(0, 20));
    setAnalyzing(false);
    setExpandedSuggestions(new Set());
    setPagesExpanded(false);
  }, [url]);

  const removeScan = useCallback((id: string) => {
    setHistory(prev => prev.filter(s => s.id !== id));
    if (activeResult?.id === id) setActiveResult(null);
  }, [activeResult]);

  const toggleSuggestion = (id: string) => {
    setExpandedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const currentMetrics = activeResult ? activeResult.metrics[deviceTab] : [];
  const currentScore = activeResult
    ? (deviceTab === 'mobile' ? activeResult.mobileScore : activeResult.desktopScore)
    : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Site Speed Analyzer</h1>
          <p className="text-muted-foreground text-sm mt-1.5">Analyze Core Web Vitals and page performance</p>
        </div>

        {/* URL Input */}
        <div className="bg-white/[0.03] border border-white/[0.04] rounded-2xl backdrop-blur-xl p-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && analyze()}
                placeholder="Enter URL to analyze (e.g. example.com)"
                className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all duration-150"
              />
            </div>
            <button
              onClick={analyze}
              disabled={analyzing || !url.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm text-white font-medium transition-all duration-200"
            >
              {analyzing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {analyzing && (
          <div className="bg-white/[0.03] border border-white/[0.04] rounded-2xl backdrop-blur-xl p-12 flex flex-col items-center justify-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-red-500 border-t-transparent" />
            <p className="text-sm text-muted-foreground">Analyzing site performance...</p>
            <p className="text-xs text-muted-foreground">Testing mobile and desktop rendering</p>
          </div>
        )}

        {/* Results */}
        {activeResult && !analyzing && (
          <>
            {/* Device Toggle + Score */}
            <div className="bg-white/[0.03] border border-white/[0.04] rounded-2xl backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Analyzed URL</p>
                  <p className="text-sm text-foreground font-mono">{activeResult.url}</p>
                </div>
                <div className="flex bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
                  <button
                    onClick={() => setDeviceTab('mobile')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-150 ${
                      deviceTab === 'mobile'
                        ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> Mobile
                  </button>
                  <button
                    onClick={() => setDeviceTab('desktop')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-150 ${
                      deviceTab === 'desktop'
                        ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Monitor className="w-4 h-4" /> Desktop
                  </button>
                </div>
              </div>

              {/* Score + Compare */}
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <ScoreGauge score={currentScore} />
                <div className="flex-1 w-full">
                  <h3 className="text-sm text-muted-foreground mb-4 font-medium">Mobile vs Desktop</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`rounded-xl p-4 border ${deviceTab === 'mobile' ? 'border-red-500/30 bg-red-500/5' : 'border-white/[0.04] bg-white/[0.02]'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Mobile</span>
                      </div>
                      <p className={`text-3xl font-bold ${scoreColor(activeResult.mobileScore)}`}>
                        {activeResult.mobileScore}
                      </p>
                    </div>
                    <div className={`rounded-xl p-4 border ${deviceTab === 'desktop' ? 'border-red-500/30 bg-red-500/5' : 'border-white/[0.04] bg-white/[0.02]'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Monitor className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Desktop</span>
                      </div>
                      <p className={`text-3xl font-bold ${scoreColor(activeResult.desktopScore)}`}>
                        {activeResult.desktopScore}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Cards */}
            <div>
              <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-red-400" />
                Core Web Vitals &amp; Metrics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {currentMetrics.map(m => (
                  <MetricCard key={m.shortName} metric={m} />
                ))}
              </div>
            </div>

            {/* Improvement Suggestions */}
            <div className="bg-white/[0.03] border border-white/[0.04] rounded-2xl backdrop-blur-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-2">
                <Zap className="w-4 h-4 text-red-400" />
                <h2 className="font-medium text-white">Improvement Suggestions</h2>
                <span className="ml-auto text-xs text-muted-foreground">{activeResult.suggestions.length} items</span>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {activeResult.suggestions
                  .sort((a, b) => {
                    const order = { critical: 0, high: 1, medium: 2, low: 3 };
                    return order[a.priority] - order[b.priority];
                  })
                  .map(s => (
                    <div key={s.id} className="hover:bg-white/[0.02] transition-colors duration-100">
                      <button
                        onClick={() => toggleSuggestion(s.id)}
                        className="w-full flex items-center gap-3 px-5 py-4 text-left"
                      >
                        {s.priority === 'critical' ? (
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        ) : s.priority === 'high' ? (
                          <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="flex-1 text-sm text-foreground">{s.title}</span>
                        <PriorityBadge priority={s.priority} />
                        <span className="text-xs text-muted-foreground ml-2 w-14 text-right">{s.savings}</span>
                        {expandedSuggestions.has(s.id) ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                      {expandedSuggestions.has(s.id) && (
                        <div className="px-5 pb-4 pl-12">
                          <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Page-by-Page Breakdown */}
            <div className="bg-white/[0.03] border border-white/[0.04] rounded-2xl backdrop-blur-xl overflow-hidden">
              <button
                onClick={() => setPagesExpanded(!pagesExpanded)}
                className="w-full flex items-center justify-between px-5 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors duration-100"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-red-400" />
                  <h2 className="font-medium text-white">Page-by-Page Breakdown</h2>
                  <span className="text-xs text-muted-foreground">{activeResult.pages.length} pages</span>
                </div>
                {pagesExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {pagesExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.04] text-left">
                        <th className="px-5 py-3 text-[11px] text-muted-foreground uppercase tracking-widest font-medium">URL</th>
                        <th className="px-4 py-3 text-[11px] text-muted-foreground uppercase tracking-widest font-medium text-center">Mobile</th>
                        <th className="px-4 py-3 text-[11px] text-muted-foreground uppercase tracking-widest font-medium text-center">Desktop</th>
                        <th className="px-4 py-3 text-[11px] text-muted-foreground uppercase tracking-widest font-medium text-center">FCP</th>
                        <th className="px-4 py-3 text-[11px] text-muted-foreground uppercase tracking-widest font-medium text-center">LCP</th>
                        <th className="px-4 py-3 text-[11px] text-muted-foreground uppercase tracking-widest font-medium text-center">CLS</th>
                        <th className="px-4 py-3 text-[11px] text-muted-foreground uppercase tracking-widest font-medium text-center">TTFB</th>
                        <th className="px-4 py-3 text-[11px] text-muted-foreground uppercase tracking-widest font-medium text-center">TBT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeResult.pages.map((p, i) => (
                        <tr key={i} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors duration-100">
                          <td className="px-5 py-3 text-xs text-muted-foreground font-mono max-w-xs truncate">{p.url}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${scoreBg(p.mobileScore)} ${scoreColor(p.mobileScore)}`}>
                              {p.mobileScore}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${scoreBg(p.desktopScore)} ${scoreColor(p.desktopScore)}`}>
                              {p.desktopScore}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground text-center">{p.fcp}s</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground text-center">{p.lcp}s</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground text-center">{p.cls}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground text-center">{p.ttfb}s</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground text-center">{p.tbt}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Scan History */}
        {history.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.04] rounded-2xl backdrop-blur-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-400" />
              <h2 className="font-medium text-white">Scan History</h2>
              <span className="ml-auto text-xs text-muted-foreground">{history.length} scans</span>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {history.map(scan => (
                <div
                  key={scan.id}
                  className={`flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors duration-100 ${
                    activeResult?.id === scan.id ? 'bg-white/[0.03]' : ''
                  }`}
                >
                  <button
                    onClick={() => { setActiveResult(scan); setExpandedSuggestions(new Set()); setPagesExpanded(false); }}
                    className="flex-1 flex items-center gap-4 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-mono truncate">{scan.url}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(scan.timestamp).toLocaleDateString()} at{' '}
                        {new Date(scan.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-sm font-semibold ${scoreColor(scan.mobileScore)}`}>{scan.mobileScore}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Monitor className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-sm font-semibold ${scoreColor(scan.desktopScore)}`}>{scan.desktopScore}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => removeScan(scan.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all duration-150"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!activeResult && !analyzing && (
          <div className="bg-white/[0.03] border border-white/[0.04] rounded-2xl backdrop-blur-xl p-16 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Gauge className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-white">Analyze Your Site Speed</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Enter a URL above to analyze Core Web Vitals, performance metrics, and get actionable improvement suggestions.
            </p>
            <div className="flex gap-6 mt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> FCP, LCP, CLS
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> TTFB, TBT
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Mobile vs Desktop
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
