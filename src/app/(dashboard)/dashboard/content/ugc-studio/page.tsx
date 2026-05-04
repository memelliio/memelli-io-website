'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Video,
  Sparkles,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Plus,
  Calendar,
  TrendingUp,
  Lightbulb,
  Copy,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Mic,
  MonitorPlay,
  Zap,
  Hash,
  ArrowRight,
  Circle,
} from 'lucide-react';

/* ================================================================= */
/*  Types                                                              */
/* ================================================================= */

interface Script {
  id: string;
  topic: string;
  tone: string;
  length: string;
  hook: string;
  body: string;
  cta: string;
  wordCount: number;
  estDuration: string;
  createdAt: string;
}

interface CalendarEntry {
  id: string;
  title: string;
  platform: string;
  date: string;
  time: string;
  status: 'scheduled' | 'draft' | 'recorded' | 'published';
  scriptId: string | null;
}

/* ================================================================= */
/*  Constants                                                          */
/* ================================================================= */

const TONES: { id: string; label: string; desc: string }[] = [
  { id: 'conversational', label: 'Conversational', desc: 'Casual, relatable' },
  { id: 'authoritative', label: 'Authoritative', desc: 'Expert, confident' },
  { id: 'energetic', label: 'Energetic', desc: 'High energy, hype' },
  { id: 'storytelling', label: 'Storytelling', desc: 'Narrative, emotional' },
  { id: 'educational', label: 'Educational', desc: 'Clear, informative' },
  { id: 'provocative', label: 'Provocative', desc: 'Bold, attention-grabbing' },
];

const LENGTHS: { id: string; label: string; seconds: string; words: string }[] = [
  { id: 'short', label: 'Short', seconds: '15-30s', words: '~75 words' },
  { id: 'medium', label: 'Medium', seconds: '60s', words: '~150 words' },
  { id: 'long', label: 'Long', seconds: '90-120s', words: '~300 words' },
  { id: 'extended', label: 'Extended', seconds: '3-5 min', words: '~600 words' },
];

const PLATFORMS = ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'YouTube', 'LinkedIn', 'Twitter/X'];

const TRENDING_TOPICS = [
  { topic: 'AI tools nobody talks about', category: 'Tech', heat: 94 },
  { topic: 'Morning routines that build wealth', category: 'Lifestyle', heat: 87 },
  { topic: 'Credit repair myths debunked', category: 'Finance', heat: 82 },
  { topic: 'Side hustles that actually scale', category: 'Business', heat: 79 },
  { topic: 'How I automated my business', category: 'Tech', heat: 76 },
  { topic: 'Things I wish I knew at 25', category: 'Lifestyle', heat: 73 },
  { topic: 'Why most people fail at funding', category: 'Finance', heat: 71 },
  { topic: 'The 3-second hook formula', category: 'Marketing', heat: 68 },
];

const HOOK_SUGGESTIONS = [
  'Stop scrolling if you want to {benefit}...',
  'Nobody is talking about this, but...',
  'I made ${amount} in {timeframe} doing this one thing...',
  'POV: You just discovered {topic}...',
  'Here\'s what {authority} won\'t tell you about {topic}...',
  'If you\'re not doing this in 2026, you\'re behind...',
  'The biggest mistake I see people make with {topic}...',
  'This changed everything for me. Here\'s why...',
  'Hot take: {controversial opinion about topic}...',
  '3 things about {topic} that will blow your mind...',
];

const MOCK_SCRIPTS: Script[] = [
  {
    id: 'sc-1',
    topic: 'Why credit repair changes everything',
    tone: 'conversational',
    length: 'medium',
    hook: 'Nobody talks about this, but your credit score is literally the key to everything.',
    body: 'Think about it. Want a house? Credit score. Want a car? Credit score. Want to start a business and get real funding? Credit score. Most people just accept a bad score and pay higher rates their whole life. But here\'s what I learned -- you can dispute inaccurate items, negotiate with creditors, and strategically rebuild faster than you think. I went from a 520 to a 740 in 11 months. Not by paying some scam company. By understanding how the system actually works.',
    cta: 'Drop a comment if you want me to break down the exact steps I used.',
    wordCount: 148,
    estDuration: '~60s',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'sc-2',
    topic: 'AI tools for small business owners',
    tone: 'energetic',
    length: 'short',
    hook: 'Stop what you\'re doing. These 3 AI tools just replaced my entire team.',
    body: 'Number one -- AI scheduling that books calls while you sleep. Number two -- automated follow-ups that sound human. Number three -- content generation that actually converts. I\'m not joking. My overhead dropped 60% last month.',
    cta: 'Follow for more AI business hacks. Link in bio.',
    wordCount: 72,
    estDuration: '~30s',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const MOCK_CALENDAR: CalendarEntry[] = [
  { id: 'cal-1', title: 'Credit Repair Tips #4', platform: 'TikTok', date: '2026-03-17', time: '10:00 AM', status: 'scheduled', scriptId: 'sc-1' },
  { id: 'cal-2', title: 'AI Tools Breakdown', platform: 'Instagram Reels', date: '2026-03-17', time: '2:00 PM', status: 'scheduled', scriptId: 'sc-2' },
  { id: 'cal-3', title: 'Morning Routine Vlog', platform: 'YouTube Shorts', date: '2026-03-18', time: '8:00 AM', status: 'draft', scriptId: null },
  { id: 'cal-4', title: 'Funding Q&A Session', platform: 'LinkedIn', date: '2026-03-19', time: '12:00 PM', status: 'draft', scriptId: null },
  { id: 'cal-5', title: 'Side Hustle Series #2', platform: 'TikTok', date: '2026-03-20', time: '6:00 PM', status: 'draft', scriptId: null },
];

/* ================================================================= */
/*  Helpers                                                            */
/* ================================================================= */

function calendarStatusColor(status: CalendarEntry['status']) {
  switch (status) {
    case 'published': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15';
    case 'recorded': return 'bg-blue-500/10 text-blue-400 border-blue-500/15';
    case 'scheduled': return 'bg-amber-500/10 text-amber-400 border-amber-500/15';
    case 'draft': return 'bg-muted text-muted-foreground border-border';
  }
}

function heatColor(heat: number) {
  if (heat >= 90) return 'text-red-400';
  if (heat >= 80) return 'text-orange-400';
  if (heat >= 70) return 'text-amber-400';
  return 'text-muted-foreground';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ================================================================= */
/*  Teleprompter Component                                             */
/* ================================================================= */

function Teleprompter({ script }: { script: Script | null }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(3);
  const [scrollPos, setScrollPos] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setScrollPos((prev) => prev + scrollSpeed * 0.5);
      }, 50);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, scrollSpeed]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = scrollPos;
    }
  }, [scrollPos]);

  const handleReset = () => {
    setIsPlaying(false);
    setScrollPos(0);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  };

  if (!script) {
    return (
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-8 text-center">
        <MonitorPlay className="h-10 w-10 text-muted-foreground mx-auto" />
        <p className="mt-3 text-sm text-muted-foreground">Select or generate a script to use the teleprompter</p>
      </div>
    );
  }

  const fullText = `${script.hook}\n\n${script.body}\n\n${script.cta}`;

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-background backdrop-blur-xl overflow-hidden">
      {/* Teleprompter Controls */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <div className="flex items-center gap-2">
          <MonitorPlay className="h-4 w-4 text-red-400" />
          <span className="text-sm font-semibold text-foreground">Teleprompter</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground mr-2">Speed</span>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setScrollSpeed(s)}
              className={`h-6 w-6 rounded-md text-[10px] font-medium transition-all duration-200 ${
                scrollSpeed === s
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-white/[0.03] text-muted-foreground border border-white/[0.04] hover:bg-white/[0.06]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Scrolling Text Area */}
      <div
        ref={containerRef}
        className="h-64 overflow-hidden px-8 py-6 relative"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Center guide line */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-red-500/20 pointer-events-none z-10" />
        <div className="pt-24 pb-48">
          <p className="text-xl leading-relaxed text-foreground font-medium whitespace-pre-line text-center">
            {fullText}
          </p>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-3 border-t border-white/[0.06] px-5 py-3">
        <button
          onClick={handleReset}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all duration-200"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 transition-all duration-200"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>
        <button
          onClick={() => setScrollPos((prev) => prev + 100)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all duration-200"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ================================================================= */
/*  Recording Interface Placeholder                                    */
/* ================================================================= */

function RecordingInterface() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      setElapsed(0);
    } else {
      setIsRecording(true);
      setElapsed(0);
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-red-400" />
          <span className="text-sm font-semibold text-foreground">Recording</span>
        </div>
        {isRecording && (
          <div className="flex items-center gap-2">
            <Circle className="h-2.5 w-2.5 text-red-500 fill-red-500 animate-pulse" />
            <span className="text-xs font-mono text-red-400">{formatTime(elapsed)}</span>
          </div>
        )}
      </div>

      {/* Camera Viewport Placeholder */}
      <div className="aspect-[9/16] max-h-[400px] bg-gradient-to-b from-zinc-900 to-zinc-950 flex flex-col items-center justify-center relative">
        {!isRecording ? (
          <>
            <Video className="h-12 w-12 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Camera preview</p>
            <p className="text-[10px] text-muted-foreground mt-1">Connect camera to begin recording</p>
          </>
        ) : (
          <>
            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg bg-red-500/20 border border-red-500/30 px-3 py-1.5">
              <Circle className="h-2 w-2 text-red-500 fill-red-500 animate-pulse" />
              <span className="text-xs font-medium text-red-300">REC</span>
            </div>
            <Mic className="h-12 w-12 text-red-500/30 animate-pulse" />
            <p className="mt-3 text-sm text-muted-foreground">Recording in progress...</p>
          </>
        )}
      </div>

      {/* Record Button */}
      <div className="flex items-center justify-center py-4 border-t border-white/[0.04]">
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition-all duration-200 ${
            isRecording
              ? 'bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30'
              : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400'
          }`}
        >
          {isRecording ? (
            <>
              <Pause className="h-4 w-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Circle className="h-4 w-4 fill-current" />
              Start Recording
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ================================================================= */
/*  Page Component                                                     */
/* ================================================================= */

export default function UGCStudioPage() {
  const [scripts, setScripts] = useState<Script[]>(MOCK_SCRIPTS);
  const [calendar, setCalendar] = useState<CalendarEntry[]>(MOCK_CALENDAR);
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [copiedHook, setCopiedHook] = useState<number | null>(null);

  // Script Generator Form
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('conversational');
  const [length, setLength] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'generator' | 'teleprompter' | 'record' | 'calendar'>('generator');

  // Calendar form
  const [showCalendarForm, setShowCalendarForm] = useState(false);
  const [calTitle, setCalTitle] = useState('');
  const [calPlatform, setCalPlatform] = useState('TikTok');
  const [calDate, setCalDate] = useState('');
  const [calTime, setCalTime] = useState('10:00');

  const handleGenerate = useCallback(() => {
    if (!topic.trim()) return;
    setIsGenerating(true);

    // Simulate AI generation
    setTimeout(() => {
      const hooks = [
        `Nobody is talking about this, but ${topic.toLowerCase()} is about to change everything.`,
        `Stop scrolling. This is the ${topic.toLowerCase()} breakdown you need.`,
        `Here's what nobody tells you about ${topic.toLowerCase()}...`,
      ];
      const selectedHook = hooks[Math.floor(Math.random() * hooks.length)] as string;

      const bodies: Record<string, string> = {
        short: `Here's the deal. ${topic} is something most people completely overlook. But the ones who get it? They're miles ahead. Let me give you the quick version.`,
        medium: `Let me break this down for you. ${topic} is one of those things that sounds simple on the surface, but when you really dig in, it changes how you think about everything. I've spent months testing this, and here's what I found. The people who succeed aren't doing anything revolutionary -- they're just doing the basics consistently and with intention. Most people overcomplicate this. Don't be most people.`,
        long: `Okay, let's really talk about ${topic}. I've been in this space for a while now, and I keep seeing the same patterns. People come in excited, they try a few things, and then they get frustrated because results don't come overnight. But here's what separates the people who win from the people who quit. First, they understand that ${topic.toLowerCase()} is a skill, not a secret. Second, they build systems instead of relying on motivation. And third, they surround themselves with people who are actually doing the work. I'm going to walk you through exactly how to implement each of these, step by step. And I promise, if you actually follow through, you'll see results faster than you expect.`,
        extended: `I want to have a real conversation about ${topic}. Not the surface-level stuff you see everywhere. The real, practical, no-BS breakdown. I've been deep in this for over a year now, and I've made every mistake you can imagine. But those mistakes taught me something valuable -- and that's exactly what I'm going to share with you today. Let's start with the fundamentals. Most people jump into ${topic.toLowerCase()} without understanding the foundation. That's like building a house on sand. You need to understand the core principles first. Once you have that foundation, everything else becomes easier. Then we'll talk about the strategies that actually work in 2026 -- not the outdated advice from three years ago. The landscape has changed dramatically, and if you're still using old playbooks, you're leaving money on the table. Finally, I'll share the exact framework I use to stay consistent and keep growing. This isn't theory. This is what I do every single day.`,
      };

      const wordCounts: Record<string, number> = { short: 72, medium: 148, long: 285, extended: 580 };
      const durations: Record<string, string> = { short: '~30s', medium: '~60s', long: '~2 min', extended: '~4 min' };

      const newScript: Script = {
        id: `sc-${Date.now()}`,
        topic: topic.trim(),
        tone,
        length,
        hook: selectedHook,
        body: bodies[length] || bodies.medium || '',
        cta: 'Follow for more. Drop a comment with your questions -- I read every single one.',
        wordCount: wordCounts[length] || 148,
        estDuration: durations[length] || '~60s',
        createdAt: new Date().toISOString(),
      };

      setScripts((prev) => [newScript, ...prev]);
      setActiveScript(newScript);
      setTopic('');
      setIsGenerating(false);
    }, 1500);
  }, [topic, tone, length]);

  const handleCopyHook = useCallback((index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHook(index);
    setTimeout(() => setCopiedHook(null), 2000);
  }, []);

  const handleAddCalendarEntry = useCallback(() => {
    if (!calTitle.trim() || !calDate) return;
    const entry: CalendarEntry = {
      id: `cal-${Date.now()}`,
      title: calTitle.trim(),
      platform: calPlatform,
      date: calDate,
      time: calTime,
      status: 'draft',
      scriptId: activeScript?.id ?? null,
    };
    setCalendar((prev) => [...prev, entry].sort((a, b) => a.date.localeCompare(b.date)));
    setCalTitle('');
    setCalDate('');
    setShowCalendarForm(false);
  }, [calTitle, calPlatform, calDate, calTime, activeScript]);

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/10">
              <Video className="h-5 w-5 text-red-400" />
            </div>
            UGC Studio
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Script, record, and schedule talking-head marketing content
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          {scripts.length} scripts
          <span className="text-muted-foreground mx-1">|</span>
          <Calendar className="h-3.5 w-3.5" />
          {calendar.filter((c) => c.status === 'scheduled').length} scheduled
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 rounded-xl border border-white/[0.04] bg-white/[0.02] p-1 w-fit">
        {[
          { id: 'generator' as const, label: 'Script Generator', icon: Sparkles },
          { id: 'teleprompter' as const, label: 'Teleprompter', icon: MonitorPlay },
          { id: 'record' as const, label: 'Record', icon: Video },
          { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border border-transparent'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================= */}
      {/*  SCRIPT GENERATOR TAB                                          */}
      {/* ============================================================= */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column: Generator Form + Scripts */}
          <div className="xl:col-span-2 space-y-6">
            {/* Generator Form */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-red-400" />
                Generate Script
              </h2>

              {/* Topic */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Topic / Subject
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Why credit repair changes everything, 3 AI tools for business..."
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 backdrop-blur-xl transition-all duration-200"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
                  Tone
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={`flex flex-col items-start gap-0.5 rounded-xl border p-3 transition-all duration-200 text-left ${
                        tone === t.id
                          ? 'border-red-500/30 bg-red-500/[0.08] shadow-lg shadow-red-500/5'
                          : 'border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.03]'
                      }`}
                    >
                      <span className={`text-xs font-semibold ${tone === t.id ? 'text-red-300' : 'text-foreground'}`}>
                        {t.label}
                      </span>
                      <span className={`text-[10px] ${tone === t.id ? 'text-red-400/60' : 'text-muted-foreground'}`}>
                        {t.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Length + Generate */}
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Length
                  </label>
                  <div className="flex gap-2">
                    {LENGTHS.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setLength(l.id)}
                        className={`flex flex-col items-start rounded-lg border px-3 py-2 transition-all duration-200 ${
                          length === l.id
                            ? 'border-red-500/30 bg-red-500/[0.08] text-red-300'
                            : 'border-white/[0.04] bg-white/[0.02] text-muted-foreground hover:border-white/[0.08]'
                        }`}
                      >
                        <span className="text-xs font-medium">{l.label}</span>
                        <span className={`text-[10px] ${length === l.id ? 'text-red-400/50' : 'text-muted-foreground'}`}>{l.seconds}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1" />

                <button
                  onClick={handleGenerate}
                  disabled={!topic.trim() || isGenerating}
                  className="shrink-0 flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-2.5 text-sm font-medium text-white hover:from-red-500 hover:to-red-400 disabled:opacity-40 transition-all duration-200"
                >
                  {isGenerating ? (
                    <Zap className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate Script'}
                </button>
              </div>
            </div>

            {/* Generated Scripts */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-red-400" />
                Scripts
                <span className="text-xs text-muted-foreground font-normal ml-1">{scripts.length} total</span>
              </h2>

              {scripts.map((script) => (
                <div
                  key={script.id}
                  className={`rounded-2xl border backdrop-blur-xl p-5 space-y-3 transition-all duration-200 cursor-pointer ${
                    activeScript?.id === script.id
                      ? 'border-red-500/20 bg-red-500/[0.03]'
                      : 'border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08]'
                  }`}
                  onClick={() => setActiveScript(script)}
                >
                  {/* Script Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{script.topic}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground capitalize">{script.tone}</span>
                        <span className="text-[10px] text-muted-foreground">|</span>
                        <span className="text-[10px] text-muted-foreground">{script.estDuration}</span>
                        <span className="text-[10px] text-muted-foreground">|</span>
                        <span className="text-[10px] text-muted-foreground">{script.wordCount} words</span>
                        <span className="text-[10px] text-muted-foreground">|</span>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(script.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveScript(script);
                        setActiveTab('teleprompter');
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[10px] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all duration-200"
                    >
                      <MonitorPlay className="h-3 w-3" />
                      Teleprompter
                    </button>
                  </div>

                  {/* Hook */}
                  <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.04] px-4 py-3">
                    <span className="text-[10px] font-medium text-amber-400/80 uppercase tracking-wider">Hook</span>
                    <p className="text-sm text-foreground mt-1">{script.hook}</p>
                  </div>

                  {/* Body */}
                  <div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Body</span>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{script.body}</p>
                  </div>

                  {/* CTA */}
                  <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] px-4 py-3">
                    <span className="text-[10px] font-medium text-emerald-400/80 uppercase tracking-wider">Call to Action</span>
                    <p className="text-sm text-foreground mt-1">{script.cta}</p>
                  </div>
                </div>
              ))}

              {scripts.length === 0 && (
                <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl py-12 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="mt-3 text-sm text-muted-foreground">No scripts yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Generate your first script above</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Trending + Hooks */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-400" />
                  Trending Topics
                </h2>
                <span className="text-[10px] text-muted-foreground">Updated hourly</span>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {TRENDING_TOPICS.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTopic(item.topic);
                      setActiveTab('generator');
                    }}
                    className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-white/[0.03] transition-all duration-200 group"
                  >
                    <span className="text-[10px] font-mono text-muted-foreground w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground group-hover:text-foreground transition-colors truncate">
                        {item.topic}
                      </p>
                      <span className="text-[10px] text-muted-foreground">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${
                            item.heat >= 90 ? 'from-red-500 to-red-400' :
                            item.heat >= 80 ? 'from-orange-500 to-orange-400' :
                            'from-amber-500 to-amber-400'
                          }`}
                          style={{ width: `${item.heat}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-mono ${heatColor(item.heat)}`}>{item.heat}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hook Suggestions */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  Hook Templates
                </h2>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {HOOK_SUGGESTIONS.map((hook, i) => (
                  <div
                    key={i}
                    className="px-5 py-3 flex items-start gap-3 hover:bg-white/[0.02] transition-all duration-200 group"
                  >
                    <Hash className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground flex-1 leading-relaxed">{hook}</p>
                    <button
                      onClick={() => handleCopyHook(i, hook)}
                      className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      {copiedHook === i ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/*  TELEPROMPTER TAB                                              */}
      {/* ============================================================= */}
      {activeTab === 'teleprompter' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Script Selector */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-400" />
              Select Script
            </h2>
            {scripts.map((script) => (
              <button
                key={script.id}
                onClick={() => setActiveScript(script)}
                className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
                  activeScript?.id === script.id
                    ? 'border-red-500/20 bg-red-500/[0.05]'
                    : 'border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08]'
                }`}
              >
                <p className="text-sm font-medium text-foreground truncate">{script.topic}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">{script.estDuration}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{script.tone}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Teleprompter */}
          <div className="lg:col-span-2">
            <Teleprompter script={activeScript} />
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/*  RECORD TAB                                                    */}
      {/* ============================================================= */}
      {activeTab === 'record' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecordingInterface />

          {/* Side: Active Script Preview */}
          <div className="space-y-4">
            {activeScript ? (
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-red-400" />
                    Active Script
                  </h2>
                  <span className="text-[10px] text-muted-foreground">{activeScript.estDuration}</span>
                </div>

                <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.04] px-4 py-3">
                  <span className="text-[10px] font-medium text-amber-400/80 uppercase tracking-wider">Hook</span>
                  <p className="text-sm text-foreground mt-1">{activeScript.hook}</p>
                </div>

                <div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Body</span>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{activeScript.body}</p>
                </div>

                <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] px-4 py-3">
                  <span className="text-[10px] font-medium text-emerald-400/80 uppercase tracking-wider">CTA</span>
                  <p className="text-sm text-foreground mt-1">{activeScript.cta}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl py-12 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">No script selected</p>
                <p className="text-xs text-muted-foreground mt-1">Generate or select a script to display while recording</p>
              </div>
            )}

            {/* Quick Tips */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                Recording Tips
              </h3>
              <div className="space-y-2">
                {[
                  'Look directly at the camera lens, not the screen',
                  'Start with energy -- the first 3 seconds decide everything',
                  'Use hand gestures to emphasize key points',
                  'Keep your background clean or use blur',
                  'Record in natural light when possible',
                  'Speak slightly faster than feels natural',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ArrowRight className="h-3 w-3 text-muted-foreground mt-1 shrink-0" />
                    <span className="text-xs text-muted-foreground">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/*  CALENDAR TAB                                                  */}
      {/* ============================================================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-400" />
              Content Calendar
            </h2>
            <button
              onClick={() => setShowCalendarForm(!showCalendarForm)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-2 text-sm font-medium text-white hover:from-red-500 hover:to-red-400 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Schedule Content
            </button>
          </div>

          {/* Add Entry Form */}
          {showCalendarForm && (
            <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.03] backdrop-blur-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">New Calendar Entry</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Title</label>
                  <input
                    type="text"
                    value={calTitle}
                    onChange={(e) => setCalTitle(e.target.value)}
                    placeholder="Content title..."
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Platform</label>
                  <select
                    value={calPlatform}
                    onChange={(e) => setCalPlatform(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-foreground focus:border-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 appearance-none"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p} className="bg-card">{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Date</label>
                  <input
                    type="date"
                    value={calDate}
                    onChange={(e) => setCalDate(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-foreground focus:border-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Time</label>
                  <input
                    type="time"
                    value={calTime}
                    onChange={(e) => setCalTime(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-foreground focus:border-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCalendarForm(false)}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-5 py-2 text-sm text-muted-foreground hover:bg-white/[0.06] transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCalendarEntry}
                  disabled={!calTitle.trim() || !calDate}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-5 py-2 text-sm font-medium text-white hover:from-red-500 hover:to-red-400 disabled:opacity-40 transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  Add to Calendar
                </button>
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
            <div className="grid grid-cols-[100px_1fr_120px_80px_80px] gap-4 px-5 py-3 border-b border-white/[0.04] text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              <span>Date</span>
              <span>Content</span>
              <span>Platform</span>
              <span>Time</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {calendar.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-[100px_1fr_120px_80px_80px] gap-4 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-all duration-200"
                >
                  <span className="text-xs font-mono text-muted-foreground">
                    {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{entry.title}</p>
                    {entry.scriptId && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <FileText className="h-2.5 w-2.5" /> Script attached
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{entry.platform}</span>
                  <span className="text-xs font-mono text-muted-foreground">{entry.time}</span>
                  <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-medium capitalize w-fit ${calendarStatusColor(entry.status)}`}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>

            {calendar.length === 0 && (
              <div className="py-12 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">No content scheduled</p>
                <p className="text-xs text-muted-foreground mt-1">Add your first content entry above</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
