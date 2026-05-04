'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Share2,
  Calendar as CalendarIcon,
  PenSquare,
  Rss,
  BarChart3,
  Sparkles,
  LayoutTemplate,
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  Image as ImageIcon,
  Video,
  Heart,
  MessageCircle,
  Repeat2,
  Eye,
  TrendingUp,
  Zap,
  Copy,
  Trash2,
  Plus,
  Check,
  Star,
  Users,
  ArrowUpRight,
  Globe,
  Wand2,
  CalendarDays,
  RefreshCw,
} from 'lucide-react';

/* ================================================================= */
/*  Types                                                              */
/* ================================================================= */

type Platform = 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'tiktok';

interface ScheduledPost {
  id: string;
  content: string;
  platforms: Platform[];
  scheduledAt: string;
  status: 'scheduled' | 'published' | 'failed';
  engagement: { likes: number; comments: number; shares: number; views: number };
  imageUrl?: string;
}

interface PostTemplate {
  id: string;
  name: string;
  content: string;
  platforms: Platform[];
  tone: string;
}

/* ================================================================= */
/*  Constants                                                          */
/* ================================================================= */

const PLATFORMS: { id: Platform; label: string; color: string; bg: string }[] = [
  { id: 'twitter', label: 'Twitter / X', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
  { id: 'linkedin', label: 'LinkedIn', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'instagram', label: 'Instagram', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
  { id: 'facebook', label: 'Facebook', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  { id: 'tiktok', label: 'TikTok', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
];

const TONES = ['Professional', 'Casual', 'Witty', 'Inspirational', 'Educational', 'Promotional'];

const TABS = [
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'compose', label: 'Compose', icon: PenSquare },
  { id: 'feed', label: 'Feed', icon: Rss },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'ai-assist', label: 'AI Assist', icon: Sparkles },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
] as const;

type TabId = (typeof TABS)[number]['id'];

/* ================================================================= */
/*  Mock Data                                                          */
/* ================================================================= */

const MOCK_POSTS: ScheduledPost[] = [
  {
    id: '1', content: 'Excited to announce our new AI-powered analytics dashboard! Track every metric that matters.', platforms: ['twitter', 'linkedin'],
    scheduledAt: '2026-03-15T10:00:00Z', status: 'published', engagement: { likes: 342, comments: 47, shares: 89, views: 12400 },
  },
  {
    id: '2', content: 'Behind the scenes of building a universe-scale operating system. Thread incoming...', platforms: ['twitter'],
    scheduledAt: '2026-03-15T14:00:00Z', status: 'published', engagement: { likes: 891, comments: 156, shares: 234, views: 34200 },
  },
  {
    id: '3', content: '5 reasons your business needs an AI command center in 2026. Here is what we learned building one.', platforms: ['linkedin', 'facebook'],
    scheduledAt: '2026-03-16T09:00:00Z', status: 'scheduled', engagement: { likes: 0, comments: 0, shares: 0, views: 0 },
  },
  {
    id: '4', content: 'The future of work is not about replacing humans. It is about giving every person a universe of AI agents working alongside them.', platforms: ['twitter', 'linkedin', 'instagram'],
    scheduledAt: '2026-03-16T16:00:00Z', status: 'scheduled', engagement: { likes: 0, comments: 0, shares: 0, views: 0 },
  },
  {
    id: '5', content: 'Just hit 10,000 tasks processed by our agent workforce in a single day. The autonomous future is here.', platforms: ['twitter', 'instagram', 'tiktok'],
    scheduledAt: '2026-03-14T12:00:00Z', status: 'published', engagement: { likes: 1203, comments: 89, shares: 456, views: 52100 },
  },
  {
    id: '6', content: 'Pro tip: Your AI agents should learn from every interaction. Here is how we built self-improving workflows.', platforms: ['linkedin'],
    scheduledAt: '2026-03-17T11:00:00Z', status: 'scheduled', engagement: { likes: 0, comments: 0, shares: 0, views: 0 },
  },
  {
    id: '7', content: 'New feature drop: Real-time sensor grid monitoring across all subsystems. Your AI sees everything.', platforms: ['twitter', 'facebook'],
    scheduledAt: '2026-03-13T15:00:00Z', status: 'published', engagement: { likes: 567, comments: 78, shares: 123, views: 18900 },
  },
  {
    id: '8', content: 'From zero to universe: How we scaled from 12 agents to 400+ autonomous workers in 30 days.', platforms: ['linkedin', 'twitter', 'instagram'],
    scheduledAt: '2026-03-18T10:00:00Z', status: 'scheduled', engagement: { likes: 0, comments: 0, shares: 0, views: 0 },
  },
];

const MOCK_TEMPLATES: PostTemplate[] = [
  { id: 't1', name: 'Product Launch', content: 'We are thrilled to announce [PRODUCT]! Here is what makes it special:\n\n1. [FEATURE 1]\n2. [FEATURE 2]\n3. [FEATURE 3]\n\nTry it now at [LINK]', platforms: ['twitter', 'linkedin'], tone: 'Professional' },
  { id: 't2', name: 'Weekly Tip', content: 'Tip of the week:\n\n[TIP]\n\nHave you tried this? Let us know in the comments!', platforms: ['twitter', 'instagram'], tone: 'Casual' },
  { id: 't3', name: 'Case Study', content: 'How [CLIENT] achieved [RESULT] using our platform:\n\nBefore: [BEFORE]\nAfter: [AFTER]\n\nFull story: [LINK]', platforms: ['linkedin'], tone: 'Professional' },
  { id: 't4', name: 'Behind the Scenes', content: 'Ever wonder what goes on behind the scenes?\n\n[INSIGHT]\n\nThis is what building the future looks like.', platforms: ['instagram', 'tiktok'], tone: 'Casual' },
  { id: 't5', name: 'Engagement Question', content: 'Quick question for our community:\n\n[QUESTION]\n\nDrop your answer below!', platforms: ['twitter', 'facebook', 'instagram'], tone: 'Casual' },
];

/* ================================================================= */
/*  Animated Counter                                                   */
/* ================================================================= */

function AnimatedCounter({ target, duration = 1200, prefix = '', suffix = '' }: { target: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ================================================================= */
/*  Platform Badge                                                     */
/* ================================================================= */

function PlatformBadge({ platform }: { platform: Platform }) {
  const p = PLATFORMS.find((pl) => pl.id === platform);
  if (!p) return null;
  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-medium ${p.bg} ${p.color}`}>
      {p.label}
    </span>
  );
}

/* ================================================================= */
/*  SVG Engagement Chart                                               */
/* ================================================================= */

function EngagementChart() {
  const data = [
    { day: 'Mon', likes: 340, comments: 45, shares: 80 },
    { day: 'Tue', likes: 520, comments: 72, shares: 110 },
    { day: 'Wed', likes: 890, comments: 156, shares: 234 },
    { day: 'Thu', likes: 670, comments: 89, shares: 145 },
    { day: 'Fri', likes: 1200, comments: 178, shares: 320 },
    { day: 'Sat', likes: 980, comments: 134, shares: 267 },
    { day: 'Sun', likes: 760, comments: 98, shares: 189 },
  ];

  const maxVal = Math.max(...data.map((d) => d.likes));
  const width = 700;
  const height = 220;
  const padL = 50;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const toX = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => padT + chartH - (v / maxVal) * chartH;

  const makePath = (key: 'likes' | 'comments' | 'shares') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d[key])}`).join(' ');

  const makeArea = (key: 'likes' | 'comments' | 'shares') => {
    const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d[key])}`).join(' ');
    return `${line} L${toX(data.length - 1)},${padT + chartH} L${toX(0)},${padT + chartH} Z`;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="likesGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(239,68,68)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="rgb(239,68,68)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="commentsGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(59,130,246)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="rgb(59,130,246)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sharesGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={padL} y1={toY(f * maxVal)} x2={width - padR} y2={toY(f * maxVal)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <text x={padL - 8} y={toY(f * maxVal) + 4} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="10">{Math.round(f * maxVal)}</text>
        </g>
      ))}
      {/* Day labels */}
      {data.map((d, i) => (
        <text key={d.day} x={toX(i)} y={height - 8} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="11">{d.day}</text>
      ))}
      {/* Area fills */}
      <path d={makeArea('likes')} fill="url(#likesGrad)" />
      <path d={makeArea('comments')} fill="url(#commentsGrad)" />
      <path d={makeArea('shares')} fill="url(#sharesGrad)" />
      {/* Lines */}
      <path d={makePath('likes')} fill="none" stroke="rgb(239,68,68)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={makePath('comments')} fill="none" stroke="rgb(59,130,246)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={makePath('shares')} fill="none" stroke="rgb(16,185,129)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {data.map((d, i) => (
        <g key={`dots-${i}`}>
          <circle cx={toX(i)} cy={toY(d.likes)} r="4" fill="rgb(239,68,68)" stroke="rgb(24,24,27)" strokeWidth="2" />
          <circle cx={toX(i)} cy={toY(d.comments)} r="3" fill="rgb(59,130,246)" stroke="rgb(24,24,27)" strokeWidth="2" />
          <circle cx={toX(i)} cy={toY(d.shares)} r="3" fill="rgb(16,185,129)" stroke="rgb(24,24,27)" strokeWidth="2" />
        </g>
      ))}
    </svg>
  );
}

/* ================================================================= */
/*  Calendar Helpers                                                   */
/* ================================================================= */

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ================================================================= */
/*  Page Component                                                     */
/* ================================================================= */

export default function SocialManagerPage() {
  const [activeTab, setActiveTab] = useState<TabId>('calendar');
  const [posts, setPosts] = useState<ScheduledPost[]>(MOCK_POSTS);
  const [templates, setTemplates] = useState<PostTemplate[]>(MOCK_TEMPLATES);

  // Calendar state
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(2); // March = 2
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Compose state
  const [composeText, setComposeText] = useState('');
  const [composePlatforms, setComposePlatforms] = useState<Platform[]>([]);
  const [composeDate, setComposeDate] = useState('');
  const [composeTime, setComposeTime] = useState('');
  const [composePreviewPlatform, setComposePreviewPlatform] = useState<Platform>('twitter');

  // AI Assist state
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('Professional');
  const [aiPlatform, setAiPlatform] = useState<Platform>('twitter');
  const [aiResult, setAiResult] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Template form state
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  /* -- Computed values -- */
  const publishedPosts = posts.filter((p) => p.status === 'published');
  const scheduledPosts = posts.filter((p) => p.status === 'scheduled');
  const totalEngagement = publishedPosts.reduce((sum, p) => sum + p.engagement.likes + p.engagement.comments + p.engagement.shares, 0);
  const totalFollowers = 28450;

  /* -- Calendar posts for selected day -- */
  const postsForDay = selectedDay
    ? posts.filter((p) => {
        const d = new Date(p.scheduledAt);
        return d.getFullYear() === calYear && d.getMonth() === calMonth && d.getDate() === selectedDay;
      })
    : [];

  /* -- Platform toggle -- */
  const togglePlatform = useCallback((platform: Platform) => {
    setComposePlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }, []);

  /* -- Compose submit -- */
  const handleCompose = useCallback(() => {
    if (!composeText.trim() || composePlatforms.length === 0) return;
    const scheduled = composeDate && composeTime ? `${composeDate}T${composeTime}:00Z` : new Date().toISOString();
    const newPost: ScheduledPost = {
      id: `p-${Date.now()}`,
      content: composeText,
      platforms: composePlatforms,
      scheduledAt: scheduled,
      status: composeDate ? 'scheduled' : 'published',
      engagement: { likes: 0, comments: 0, shares: 0, views: 0 },
    };
    setPosts((prev) => [newPost, ...prev]);
    setComposeText('');
    setComposePlatforms([]);
    setComposeDate('');
    setComposeTime('');
  }, [composeText, composePlatforms, composeDate, composeTime]);

  /* -- AI Generate -- */
  const handleAiGenerate = useCallback(() => {
    if (!aiTopic.trim()) return;
    setAiGenerating(true);
    setAiResult('');
    setTimeout(() => {
      const results: Record<string, string> = {
        Professional: `Exciting developments in ${aiTopic}. Here is what industry leaders need to know:\n\n1. The landscape is shifting toward AI-driven solutions\n2. Early adopters are seeing 3x productivity gains\n3. Integration complexity is dropping fast\n\nWhat is your take? Share your experience below.\n\n#${aiTopic.replace(/\s+/g, '')} #Innovation #Future`,
        Casual: `Okay so can we talk about ${aiTopic} for a sec?\n\nThis stuff is actually wild. We have been diving deep into it and honestly the possibilities are endless.\n\nDrop a comment if you want the full breakdown!\n\n#${aiTopic.replace(/\s+/g, '')}`,
        Witty: `Plot twist: ${aiTopic} is not what you think it is.\n\nSpoiler alert - it is actually way cooler.\n\nHere is the thing nobody is talking about yet...\n\n#${aiTopic.replace(/\s+/g, '')} #GameChanger`,
        Inspirational: `The journey of ${aiTopic} reminds us that every great innovation starts with a single bold idea.\n\nDream bigger. Build faster. Impact millions.\n\nYour next breakthrough is closer than you think.\n\n#${aiTopic.replace(/\s+/g, '')} #Inspiration #Innovation`,
        Educational: `Let us break down ${aiTopic} in simple terms:\n\nWhat it is: A transformative approach to modern challenges\nWhy it matters: 78% of top companies are investing in it\nHow to start: Begin with small experiments, scale what works\n\nSave this post for later!\n\n#${aiTopic.replace(/\s+/g, '')} #Learning`,
        Promotional: `Introducing our latest solution for ${aiTopic}!\n\nWhat you get:\n- Automated workflows\n- Real-time analytics\n- AI-powered insights\n- 24/7 agent support\n\nLimit time offer: Start your free trial today.\n\nLink in bio.\n\n#${aiTopic.replace(/\s+/g, '')} #Launch`,
      };
      setAiResult(results[aiTone] || results['Professional']);
      setAiGenerating(false);
    }, 1500);
  }, [aiTopic, aiTone]);

  /* -- AI Generate Week -- */
  const handleGenerateWeek = useCallback(() => {
    setAiGenerating(true);
    setTimeout(() => {
      const topics = [
        'Industry insights and trends', 'Behind the scenes of our team', 'Customer success story',
        'Quick tip for productivity', 'Product feature spotlight', 'Community question',
        'Weekend motivation and reflection',
      ];
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const result = days.map((day, i) => `${day}: ${topics[i]}\n"${topics[i]} - crafted for maximum engagement on ${aiPlatform}. Optimized for peak posting hours."`).join('\n\n');
      setAiResult(`7-Day Content Plan for ${aiPlatform}:\n\n${result}\n\nAll posts optimized for ${aiPlatform} best practices and peak engagement windows.`);
      setAiGenerating(false);
    }, 2000);
  }, [aiPlatform]);

  /* -- Save as template -- */
  const handleSaveTemplate = useCallback(() => {
    if (!newTemplateName.trim() || !composeText.trim()) return;
    const newTpl: PostTemplate = {
      id: `t-${Date.now()}`,
      name: newTemplateName,
      content: composeText,
      platforms: composePlatforms,
      tone: 'Professional',
    };
    setTemplates((prev) => [newTpl, ...prev]);
    setNewTemplateName('');
    setShowTemplateForm(false);
  }, [newTemplateName, composeText, composePlatforms]);

  /* -- Load template into compose -- */
  const loadTemplate = useCallback((tpl: PostTemplate) => {
    setComposeText(tpl.content);
    setComposePlatforms(tpl.platforms);
    setActiveTab('compose');
  }, []);

  /* -- Use AI result -- */
  const useAiResult = useCallback(() => {
    setComposeText(aiResult);
    setComposePlatforms([aiPlatform]);
    setActiveTab('compose');
  }, [aiResult, aiPlatform]);

  /* -- Calendar navigation -- */
  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
    setSelectedDay(null);
  };

  /* -- Render -- */
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/10">
              <Share2 className="h-5 w-5 text-red-400" />
            </div>
            Social Media Manager
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Schedule, publish, and analyze your social media presence across all platforms
          </p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Scheduled', value: scheduledPosts.length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/15' },
          { label: 'Published This Week', value: publishedPosts.length, icon: Send, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/15' },
          { label: 'Total Engagement', value: totalEngagement, icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/15' },
          { label: 'Followers', value: totalFollowers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/15' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-foreground">
                <AnimatedCounter target={stat.value} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-1.5 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                active
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">

        {/* ==================== CALENDAR TAB ==================== */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-2 rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">{MONTH_NAMES[calMonth]} {calYear}</h2>
                <div className="flex gap-2">
                  <button onClick={prevMonth} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={nextMonth} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: getFirstDayOfWeek(calYear, calMonth) }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-20 rounded-xl" />
                ))}
                {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
                  const day = i + 1;
                  const dayPosts = posts.filter((p) => {
                    const d = new Date(p.scheduledAt);
                    return d.getFullYear() === calYear && d.getMonth() === calMonth && d.getDate() === day;
                  });
                  const isSelected = selectedDay === day;
                  const isToday = calYear === 2026 && calMonth === 2 && day === 15;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`h-20 rounded-xl border p-2 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-red-500/30 bg-red-500/5'
                          : isToday
                            ? 'border-white/[0.08] bg-white/[0.04]'
                            : 'border-white/[0.02] hover:border-white/[0.06] hover:bg-white/[0.02]'
                      }`}
                    >
                      <span className={`text-xs font-medium ${isToday ? 'text-red-400' : 'text-muted-foreground'}`}>{day}</span>
                      {dayPosts.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {dayPosts.map((post) =>
                            post.platforms.map((platform) => {
                              const pl = PLATFORMS.find((pp) => pp.id === platform);
                              return (
                                <div
                                  key={`${post.id}-${platform}`}
                                  className={`h-2 w-2 rounded-full ${
                                    platform === 'twitter' ? 'bg-sky-400' :
                                    platform === 'linkedin' ? 'bg-blue-400' :
                                    platform === 'instagram' ? 'bg-pink-400' :
                                    platform === 'facebook' ? 'bg-indigo-400' :
                                    'bg-emerald-400'
                                  }`}
                                  title={pl?.label}
                                />
                              );
                            })
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.04]">
                {PLATFORMS.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <div className={`h-2.5 w-2.5 rounded-full ${
                      p.id === 'twitter' ? 'bg-sky-400' :
                      p.id === 'linkedin' ? 'bg-blue-400' :
                      p.id === 'instagram' ? 'bg-pink-400' :
                      p.id === 'facebook' ? 'bg-indigo-400' :
                      'bg-emerald-400'
                    }`} />
                    <span className="text-[10px] text-muted-foreground">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day Detail Panel */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-red-400" />
                {selectedDay ? `${MONTH_NAMES[calMonth]} ${selectedDay}, ${calYear}` : 'Select a day'}
              </h3>
              {selectedDay && postsForDay.length === 0 && (
                <div className="py-12 text-center">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="mt-3 text-sm text-muted-foreground">No posts scheduled</p>
                  <button
                    onClick={() => setActiveTab('compose')}
                    className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    + Create a post
                  </button>
                </div>
              )}
              {postsForDay.map((post) => (
                <div key={post.id} className="mb-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {post.platforms.map((p) => <PlatformBadge key={p} platform={p} />)}
                    <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-lg border ${
                      post.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{post.content}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              {!selectedDay && (
                <div className="py-12 text-center">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="mt-3 text-sm text-muted-foreground">Click a day to see posts</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== COMPOSE TAB ==================== */}
        {activeTab === 'compose' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <PenSquare className="h-4 w-4 text-red-400" />
                Create Post
              </h2>

              {/* Text editor */}
              <textarea
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                placeholder="What do you want to share with the world?"
                rows={6}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 backdrop-blur-xl transition-all resize-none"
              />
              <div className="text-right text-xs text-muted-foreground">{composeText.length} characters</div>

              {/* Media upload */}
              <div className="flex gap-3">
                <button className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all">
                  <ImageIcon className="h-4 w-4" />
                  Image
                </button>
                <button className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all">
                  <Video className="h-4 w-4" />
                  Video
                </button>
              </div>

              {/* Platform selector */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Platforms</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PLATFORMS.map((p) => {
                    const selected = composePlatforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all duration-200 ${
                          selected
                            ? `${p.bg} ${p.color}`
                            : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.1]'
                        }`}
                      >
                        {selected && <Check className="h-3.5 w-3.5" />}
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    value={composeDate}
                    onChange={(e) => setComposeDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-foreground focus:border-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</label>
                  <input
                    type="time"
                    value={composeTime}
                    onChange={(e) => setComposeTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-foreground focus:border-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCompose}
                  disabled={!composeText.trim() || composePlatforms.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 text-sm font-medium text-white hover:from-red-500 hover:to-red-400 disabled:opacity-40 transition-all duration-200"
                >
                  <Send className="h-4 w-4" />
                  {composeDate ? 'Schedule Post' : 'Post Now'}
                </button>
                <button
                  onClick={() => setShowTemplateForm(true)}
                  disabled={!composeText.trim()}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground hover:bg-white/[0.06] hover:text-foreground disabled:opacity-40 transition-all"
                >
                  <LayoutTemplate className="h-4 w-4" />
                  Save Template
                </button>
              </div>

              {/* Template name form */}
              {showTemplateForm && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Template name..."
                    className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                  />
                  <button onClick={handleSaveTemplate} className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/20 transition-all">
                    Save
                  </button>
                  <button onClick={() => setShowTemplateForm(false)} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-all">
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4 text-red-400" />
                  Preview
                </h2>
                <div className="flex gap-1">
                  {composePlatforms.map((p) => (
                    <button
                      key={p}
                      onClick={() => setComposePreviewPlatform(p)}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all ${
                        composePreviewPlatform === p
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {PLATFORMS.find((pl) => pl.id === p)?.label}
                    </button>
                  ))}
                </div>
              </div>

              {composeText ? (
                <div className="rounded-xl border border-white/[0.06] bg-background p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-sm font-bold">M</div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">Memelli Universe</div>
                      <div className="text-xs text-muted-foreground">@memelli_universe</div>
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{composeText}</p>
                  <div className="flex items-center gap-6 mt-4 pt-3 border-t border-white/[0.06]">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Heart className="h-3.5 w-3.5" /> 0</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MessageCircle className="h-3.5 w-3.5" /> 0</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Repeat2 className="h-3.5 w-3.5" /> 0</span>
                  </div>
                  {composePreviewPlatform === 'twitter' && composeText.length > 280 && (
                    <div className="mt-3 text-xs text-amber-400 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      Exceeds 280 character limit ({composeText.length}/280)
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <Eye className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="mt-3 text-sm text-muted-foreground">Start typing to see preview</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== FEED TAB ==================== */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            {publishedPosts.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl py-16 text-center">
                <Rss className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">No published posts yet</p>
              </div>
            ) : (
              publishedPosts.map((post) => (
                <div key={post.id} className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 hover:border-white/[0.08] transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-sm font-bold shrink-0">M</div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">Memelli Universe</div>
                        <div className="text-xs text-muted-foreground">{new Date(post.scheduledAt).toLocaleDateString()} at {new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {post.platforms.map((p) => <PlatformBadge key={p} platform={p} />)}
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/[0.04]">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Heart className="h-4 w-4 text-red-400" />
                      <AnimatedCounter target={post.engagement.likes} duration={800} />
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MessageCircle className="h-4 w-4 text-blue-400" />
                      <AnimatedCounter target={post.engagement.comments} duration={800} />
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Repeat2 className="h-4 w-4 text-emerald-400" />
                      <AnimatedCounter target={post.engagement.shares} duration={800} />
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground ml-auto">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <AnimatedCounter target={post.engagement.views} duration={800} />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ==================== ANALYTICS TAB ==================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Engagement Chart */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-400" />
                  Weekly Engagement
                </h2>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Likes</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Comments</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Shares</span>
                </div>
              </div>
              <EngagementChart />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Best Performing */}
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Star className="h-4 w-4 text-red-400" />
                  Best Performing Posts
                </h2>
                <div className="space-y-3">
                  {publishedPosts
                    .sort((a, b) => (b.engagement.likes + b.engagement.shares) - (a.engagement.likes + a.engagement.shares))
                    .slice(0, 3)
                    .map((post, i) => (
                      <div key={post.id} className="flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold shrink-0 ${
                          i === 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          i === 1 ? 'bg-muted text-muted-foreground border border-border' :
                          'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        }`}>
                          #{i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{post.content}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Heart className="h-3 w-3" />{post.engagement.likes.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Repeat2 className="h-3 w-3" />{post.engagement.shares.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" />{post.engagement.views.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Optimal Times + Platform Breakdown */}
              <div className="space-y-6">
                {/* Optimal Posting Times */}
                <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-red-400" />
                    Optimal Posting Times
                  </h2>
                  <div className="space-y-3">
                    {[
                      { time: '9:00 AM', label: 'Morning Peak', engagement: 89 },
                      { time: '12:30 PM', label: 'Lunch Break', engagement: 76 },
                      { time: '6:00 PM', label: 'After Work', engagement: 94 },
                      { time: '8:30 PM', label: 'Evening', engagement: 71 },
                    ].map((slot) => (
                      <div key={slot.time} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16 shrink-0">{slot.time}</span>
                        <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-1000"
                            style={{ width: `${slot.engagement}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{slot.engagement}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Platform Breakdown */}
                <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                    <Globe className="h-4 w-4 text-red-400" />
                    Platform Breakdown
                  </h2>
                  <div className="space-y-3">
                    {[
                      { platform: 'Twitter / X', posts: 5, engagement: 3200, color: 'bg-sky-400' },
                      { platform: 'LinkedIn', posts: 4, engagement: 2100, color: 'bg-blue-400' },
                      { platform: 'Instagram', posts: 3, engagement: 1800, color: 'bg-pink-400' },
                      { platform: 'Facebook', posts: 2, engagement: 890, color: 'bg-indigo-400' },
                      { platform: 'TikTok', posts: 1, engagement: 650, color: 'bg-emerald-400' },
                    ].map((p) => (
                      <div key={p.platform} className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${p.color} shrink-0`} />
                        <span className="text-sm text-foreground flex-1">{p.platform}</span>
                        <span className="text-xs text-muted-foreground">{p.posts} posts</span>
                        <span className="text-xs text-muted-foreground font-medium w-16 text-right">{p.engagement.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== AI ASSIST TAB ==================== */}
        {activeTab === 'ai-assist' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generate Post */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-red-400" />
                Generate Post
              </h2>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topic</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Enter a topic or idea..."
                  className="mt-1 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tone</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {TONES.map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setAiTone(tone)}
                      className={`rounded-xl border px-3 py-2 text-sm transition-all duration-200 ${
                        aiTone === tone
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.1] hover:text-foreground'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Platform</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setAiPlatform(p.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all duration-200 ${
                        aiPlatform === p.id
                          ? `${p.bg} ${p.color}`
                          : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.1]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAiGenerate}
                  disabled={!aiTopic.trim() || aiGenerating}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 text-sm font-medium text-white hover:from-red-500 hover:to-red-400 disabled:opacity-40 transition-all duration-200"
                >
                  {aiGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate Post
                </button>
                <button
                  onClick={handleGenerateWeek}
                  disabled={aiGenerating}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground hover:bg-white/[0.06] hover:text-foreground disabled:opacity-40 transition-all"
                >
                  <CalendarDays className="h-4 w-4" />
                  Generate Week
                </button>
              </div>
            </div>

            {/* AI Result */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-red-400" />
                Generated Content
              </h2>

              {aiGenerating ? (
                <div className="py-16 text-center">
                  <div className="relative mx-auto h-12 w-12">
                    <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-ping" />
                    <div className="absolute inset-2 rounded-full border-2 border-red-500/40 animate-pulse" />
                    <div className="absolute inset-4 rounded-full bg-red-500/20" />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">AI is crafting your content...</p>
                </div>
              ) : aiResult ? (
                <>
                  <div className="rounded-xl border border-white/[0.06] bg-background p-5">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{aiResult}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={useAiResult}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Use in Compose
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(aiResult)}
                      className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-16 text-center">
                  <Wand2 className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="mt-3 text-sm text-muted-foreground">Enter a topic and generate AI-powered content</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TEMPLATES TAB ==================== */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            {templates.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl py-16 text-center">
                <LayoutTemplate className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">No templates saved yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create a post and save it as a template for reuse</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 hover:border-white/[0.08] transition-all duration-200 group">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-foreground">{tpl.name}</h3>
                      <button
                        onClick={() => setTemplates((prev) => prev.filter((t) => t.id !== tpl.id))}
                        className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-3">{tpl.content}</p>
                    <div className="flex items-center gap-1.5 mb-3">
                      {tpl.platforms.map((p) => <PlatformBadge key={p} platform={p} />)}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{tpl.tone}</span>
                      <button
                        onClick={() => loadTemplate(tpl)}
                        className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition-all"
                      >
                        <Copy className="h-3 w-3" />
                        Use
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
