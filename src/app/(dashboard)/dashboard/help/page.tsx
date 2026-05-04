'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Rocket,
  Users,
  ShoppingCart,
  BarChart3,
  MessageSquare,
  CreditCard,
  Code2,
  Wrench,
  Play,
  Clock,
  Star,
  ChevronRight,
  Headphones,
  Bot,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Command,
  ArrowRight,
  BookOpen,
  ExternalLink,
  Keyboard,
  X,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { id: 'getting-started', label: 'Getting Started', icon: Rocket, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', articles: 12, description: 'Setup guides, onboarding, and first steps' },
  { id: 'crm', label: 'CRM', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', articles: 24, description: 'Contacts, pipelines, deals, and automations' },
  { id: 'commerce', label: 'Commerce', icon: ShoppingCart, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', articles: 18, description: 'Products, orders, subscriptions, and payments' },
  { id: 'seo', label: 'SEO & Traffic', icon: BarChart3, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', articles: 15, description: 'Keywords, content generation, and rankings' },
  { id: 'communications', label: 'Communications', icon: MessageSquare, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', articles: 20, description: 'SMS, email, chat, and voice channels' },
  { id: 'billing', label: 'Billing', icon: CreditCard, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', articles: 10, description: 'Plans, invoices, usage, and upgrades' },
  { id: 'api', label: 'API & Integrations', icon: Code2, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', articles: 22, description: 'REST API, webhooks, and third-party tools' },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: Wrench, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', articles: 16, description: 'Common issues, errors, and fixes' },
] as const;

const POPULAR_ARTICLES = [
  { id: '1', title: 'How to set up your first pipeline', category: 'CRM', readTime: '4 min', featured: true },
  { id: '2', title: 'Connecting your custom domain', category: 'Getting Started', readTime: '3 min', featured: true },
  { id: '3', title: 'Understanding AI agent workflows', category: 'Getting Started', readTime: '6 min', featured: false },
  { id: '4', title: 'Setting up SMS and email campaigns', category: 'Communications', readTime: '5 min', featured: false },
  { id: '5', title: 'Creating products and managing inventory', category: 'Commerce', readTime: '4 min', featured: false },
  { id: '6', title: 'API authentication and rate limits', category: 'API & Integrations', readTime: '3 min', featured: false },
  { id: '7', title: 'Configuring keyword clusters for SEO', category: 'SEO & Traffic', readTime: '5 min', featured: false },
  { id: '8', title: 'Managing team roles and permissions', category: 'Getting Started', readTime: '3 min', featured: false },
  { id: '9', title: 'Troubleshooting webhook delivery failures', category: 'Troubleshooting', readTime: '4 min', featured: false },
  { id: '10', title: 'Billing cycle and plan upgrades', category: 'Billing', readTime: '2 min', featured: false },
] as const;

const VIDEO_TUTORIALS = [
  { id: 'v1', title: 'Platform Overview & Navigation', duration: '8:24', thumbnail: '/thumbnails/overview.jpg', category: 'Getting Started' },
  { id: 'v2', title: 'Building Your First CRM Pipeline', duration: '12:15', thumbnail: '/thumbnails/crm.jpg', category: 'CRM' },
  { id: 'v3', title: 'AI Agent Configuration Deep Dive', duration: '15:40', thumbnail: '/thumbnails/agents.jpg', category: 'Getting Started' },
  { id: 'v4', title: 'Commerce Store Setup Guide', duration: '10:32', thumbnail: '/thumbnails/commerce.jpg', category: 'Commerce' },
  { id: 'v5', title: 'SEO Keyword Strategy & Content', duration: '11:08', thumbnail: '/thumbnails/seo.jpg', category: 'SEO & Traffic' },
  { id: 'v6', title: 'API Integration Walkthrough', duration: '14:20', thumbnail: '/thumbnails/api.jpg', category: 'API & Integrations' },
] as const;

const KEYBOARD_SHORTCUTS = [
  { keys: ['Ctrl', 'K'], action: 'Open command palette' },
  { keys: ['Ctrl', 'B'], action: 'Toggle sidebar' },
  { keys: ['Ctrl', '/'], action: 'Open help search' },
  { keys: ['Ctrl', 'N'], action: 'New record' },
  { keys: ['Ctrl', 'Shift', 'P'], action: 'Open pipeline view' },
  { keys: ['Ctrl', '.'], action: 'Talk to Melli' },
  { keys: ['Esc'], action: 'Close modal / panel' },
  { keys: ['Ctrl', 'S'], action: 'Save changes' },
  { keys: ['Ctrl', 'Shift', 'D'], action: 'Toggle dev terminal' },
  { keys: ['?'], action: 'Show keyboard shortcuts' },
] as const;

type SystemStatus = 'operational' | 'degraded' | 'outage';

const SYSTEM_STATUS: { label: string; status: SystemStatus }[] = [
  { label: 'API', status: 'operational' },
  { label: 'Dashboard', status: 'operational' },
  { label: 'Workers', status: 'operational' },
  { label: 'Database', status: 'operational' },
  { label: 'AI Services', status: 'operational' },
  { label: 'SMS / Voice', status: 'operational' },
];

const statusConfig: Record<SystemStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  operational: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Operational' },
  degraded: { icon: AlertTriangle, color: 'text-amber-400', label: 'Degraded' },
  outage: { icon: XCircle, color: 'text-red-400', label: 'Outage' },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const overallStatus: SystemStatus = SYSTEM_STATUS.some((s) => s.status === 'outage')
    ? 'outage'
    : SYSTEM_STATUS.some((s) => s.status === 'degraded')
      ? 'degraded'
      : 'operational';

  /* Search filtering */
  const filteredArticles = useMemo(() => {
    if (!search.trim()) return POPULAR_ARTICLES;
    const q = search.toLowerCase();
    return POPULAR_ARTICLES.filter(
      (a) => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q),
    );
  }, [search]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CATEGORIES;
    const q = search.toLowerCase();
    return CATEGORIES.filter(
      (c) => c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
    );
  }, [search]);

  const filteredVideos = useMemo(() => {
    if (!search.trim()) return VIDEO_TUTORIALS;
    const q = search.toLowerCase();
    return VIDEO_TUTORIALS.filter(
      (v) => v.title.toLowerCase().includes(q) || v.category.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div className="min-h-screen pb-20">
      {/* ---- Header ---- */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white/90">Help Center</h1>
            <p className="text-white/40 mt-1.5 text-sm">Find answers, watch tutorials, and get support.</p>
          </div>

          {/* System Status Indicator */}
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
            {(() => {
              const cfg = statusConfig[overallStatus];
              const Icon = cfg.icon;
              return (
                <>
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                  <span className="text-xs font-medium text-white/60">All Systems {cfg.label}</span>
                </>
              );
            })()}
          </button>
        </div>
      </div>

      {/* ---- Search Bar ---- */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search help articles, tutorials, and guides..."
            className="w-full pl-12 pr-28 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/30 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-white/20 text-xs pointer-events-none">
            <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.04] font-mono">Ctrl</kbd>
            <span>/</span>
            <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.04] font-mono">/</kbd>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-10">
        {/* ---- Category Grid ---- */}
        <section>
          <h2 className="text-lg font-semibold text-white/80 mb-4">Browse by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                className={`group relative flex flex-col items-start gap-3 p-4 rounded-xl border ${cat.border} ${cat.bg} hover:brightness-125 transition-all duration-200 text-left`}
              >
                <div className="flex items-center gap-3 w-full">
                  <cat.icon className={`h-5 w-5 ${cat.color} shrink-0`} />
                  <span className="text-sm font-medium text-white/80 group-hover:text-white/95 transition-colors">{cat.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-white/20 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-white/35 leading-relaxed">{cat.description}</p>
                <span className="text-[10px] text-white/25 font-medium uppercase tracking-wider">{cat.articles} articles</span>
              </button>
            ))}
          </div>
          {filteredCategories.length === 0 && (
            <p className="text-sm text-white/30 text-center py-8">No categories match your search.</p>
          )}
        </section>

        {/* ---- Popular Articles ---- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white/80">Popular Articles</h2>
            <button className="flex items-center gap-1.5 text-xs text-red-400/80 hover:text-red-400 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredArticles.map((article) => (
              <button
                key={article.id}
                className="group flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200 text-left"
              >
                <BookOpen className="h-4 w-4 text-white/20 shrink-0 group-hover:text-red-400/60 transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70 group-hover:text-white/90 truncate transition-colors">{article.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-white/25">{article.category}</span>
                    <span className="text-white/10">|</span>
                    <span className="flex items-center gap-1 text-[10px] text-white/25">
                      <Clock className="h-2.5 w-2.5" /> {article.readTime}
                    </span>
                  </div>
                </div>
                {article.featured && (
                  <Star className="h-3.5 w-3.5 text-amber-400/50 shrink-0" />
                )}
                <ChevronRight className="h-3.5 w-3.5 text-white/15 shrink-0 group-hover:text-white/40 transition-colors" />
              </button>
            ))}
          </div>
          {filteredArticles.length === 0 && (
            <p className="text-sm text-white/30 text-center py-8">No articles match your search.</p>
          )}
        </section>

        {/* ---- Video Tutorials ---- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white/80">Video Tutorials</h2>
            <button className="flex items-center gap-1.5 text-xs text-red-400/80 hover:text-red-400 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((video) => (
              <button
                key={video.id}
                className="group flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200 overflow-hidden text-left"
              >
                {/* Thumbnail */}
                <div className="relative w-full aspect-video bg-gradient-to-br from-white/[0.04] to-white/[0.01] flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center group-hover:bg-red-500/30 group-hover:scale-110 transition-all duration-300">
                    <Play className="h-5 w-5 text-red-400 ml-0.5" />
                  </div>
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-background text-[10px] text-white/70 font-mono">{video.duration}</span>
                </div>
                {/* Info */}
                <div className="p-3.5">
                  <p className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors leading-snug">{video.title}</p>
                  <span className="text-[10px] text-white/25 mt-1 block">{video.category}</span>
                </div>
              </button>
            ))}
          </div>
          {filteredVideos.length === 0 && (
            <p className="text-sm text-white/30 text-center py-8">No tutorials match your search.</p>
          )}
        </section>

        {/* ---- Support Actions + System Status + Shortcuts ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Contact Support + Talk to Melli */}
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] hover:bg-red-500/[0.12] transition-all duration-200 group text-left">
              <div className="w-10 h-10 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
                <Headphones className="h-5 w-5 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white/80 group-hover:text-white/95 transition-colors">Contact Support</p>
                <p className="text-[11px] text-white/30 mt-0.5">Get help from the Memelli team</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-white/20 group-hover:text-red-400/60 transition-colors" />
            </button>

            <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/80/[0.06] hover:bg-primary/80/[0.12] transition-all duration-200 group text-left">
              <div className="w-10 h-10 rounded-lg bg-primary/80/15 border border-primary/25 flex items-center justify-center shrink-0 relative">
                <Bot className="h-5 w-5 text-primary" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0a0f]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white/80 group-hover:text-white/95 transition-colors">Talk to Melli</p>
                <p className="text-[11px] text-white/30 mt-0.5">AI assistant -- always online</p>
              </div>
              <span className="text-[10px] text-emerald-400/60 font-medium">Online</span>
            </button>
          </div>

          {/* System Status Panel */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/70">System Status</h3>
              {(() => {
                const cfg = statusConfig[overallStatus];
                return <span className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>;
              })()}
            </div>
            <div className="space-y-2">
              {SYSTEM_STATUS.map((service) => {
                const cfg = statusConfig[service.status];
                const Icon = cfg.icon;
                return (
                  <div key={service.label} className="flex items-center justify-between py-1">
                    <span className="text-xs text-white/50">{service.label}</span>
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-3 w-3 ${cfg.color}`} />
                      <span className={`text-[10px] ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/70">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
              >
                {showShortcuts ? 'Show less' : 'Show all'}
              </button>
            </div>
            <div className="space-y-1.5">
              {(showShortcuts ? KEYBOARD_SHORTCUTS : KEYBOARD_SHORTCUTS.slice(0, 6)).map((shortcut) => (
                <div key={shortcut.action} className="flex items-center justify-between py-1">
                  <span className="text-xs text-white/50">{shortcut.action}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={i}>
                        <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.04] text-[10px] text-white/40 font-mono">{key}</kbd>
                        {i < shortcut.keys.length - 1 && <span className="text-white/15 mx-0.5 text-[10px]">+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
