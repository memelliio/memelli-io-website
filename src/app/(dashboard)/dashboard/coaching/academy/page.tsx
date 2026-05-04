'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useApiQuery } from '@/hooks/useApiQuery';
import { DemoBanner } from '@/components/shared/DemoBadge';
import {
  GraduationCap,
  Briefcase,
  Megaphone,
  Cpu,
  Zap,
  Monitor,
  Languages,
  Flame,
  Trophy,
  Star,
  Award,
  Target,
  BookOpen,
  Clock,
  ArrowRight,
  Send,
  X,
  MessageCircle,
  ChevronRight,
  Sparkles,
  Medal,
  Crown,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface School {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  courseCount: number;
  color: string;
  gradient: string;
}

interface EnrolledCourse {
  id: string;
  title: string;
  school: string;
  progress: number;
  lastAccessed: string;
  nextLesson: string;
  totalLessons: number;
  completedLessons: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  earnedAt?: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  coursesCompleted: number;
}

interface TutorMessage {
  id: string;
  role: 'user' | 'tutor';
  content: string;
  timestamp: Date;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const SCHOOLS: School[] = [
  {
    id: 'business',
    name: 'Business School',
    description: 'Entrepreneurship, finance, strategy, and operations fundamentals',
    icon: <Briefcase className="h-6 w-6" />,
    courseCount: 12,
    color: 'text-red-400',
    gradient: 'from-red-500/20 to-red-900/10',
  },
  {
    id: 'marketing',
    name: 'Marketing School',
    description: 'Digital marketing, funnels, copywriting, and brand building',
    icon: <Megaphone className="h-6 w-6" />,
    courseCount: 9,
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-orange-900/10',
  },
  {
    id: 'technology',
    name: 'Technology School',
    description: 'Web development, APIs, databases, and cloud infrastructure',
    icon: <Cpu className="h-6 w-6" />,
    courseCount: 15,
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-blue-900/10',
  },
  {
    id: 'automation',
    name: 'Automation School',
    description: 'Workflows, AI automation, integrations, and system design',
    icon: <Zap className="h-6 w-6" />,
    courseCount: 8,
    color: 'text-yellow-400',
    gradient: 'from-yellow-500/20 to-yellow-900/10',
  },
  {
    id: 'platform',
    name: 'Platform Training',
    description: 'Master every feature of the Memelli Universe platform',
    icon: <Monitor className="h-6 w-6" />,
    courseCount: 20,
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/20 to-emerald-900/10',
  },
  {
    id: 'language',
    name: 'Language Lab',
    description: 'AI-powered language learning with conversation practice',
    icon: <Languages className="h-6 w-6" />,
    courseCount: 6,
    color: 'text-primary',
    gradient: 'from-purple-500/20 to-purple-900/10',
  },
];

const ENROLLED_COURSES: EnrolledCourse[] = [
  {
    id: 'c1',
    title: 'Digital Marketing Foundations',
    school: 'Marketing School',
    progress: 72,
    lastAccessed: '2 hours ago',
    nextLesson: 'Email Campaign Optimization',
    totalLessons: 18,
    completedLessons: 13,
  },
  {
    id: 'c2',
    title: 'Platform Mastery: CRM Engine',
    school: 'Platform Training',
    progress: 45,
    lastAccessed: '1 day ago',
    nextLesson: 'Pipeline Automation',
    totalLessons: 12,
    completedLessons: 5,
  },
  {
    id: 'c3',
    title: 'AI Workflow Builder',
    school: 'Automation School',
    progress: 18,
    lastAccessed: '3 days ago',
    nextLesson: 'Trigger Conditions',
    totalLessons: 10,
    completedLessons: 2,
  },
];

const ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', name: 'First Lesson', description: 'Complete your first lesson', icon: <BookOpen className="h-5 w-5" />, earned: true, earnedAt: '2 weeks ago' },
  { id: 'a2', name: '5 Day Streak', description: 'Learn 5 days in a row', icon: <Flame className="h-5 w-5" />, earned: true, earnedAt: '4 days ago' },
  { id: 'a3', name: 'Course Complete', description: 'Finish an entire course', icon: <Trophy className="h-5 w-5" />, earned: true, earnedAt: '1 week ago' },
  { id: 'a4', name: 'Marketing Expert', description: 'Complete all Marketing School courses', icon: <Medal className="h-5 w-5" />, earned: false },
  { id: 'a5', name: 'Automation Pro', description: 'Complete all Automation School courses', icon: <Zap className="h-5 w-5" />, earned: false },
  { id: 'a6', name: 'Quick Learner', description: 'Complete 3 lessons in one day', icon: <Sparkles className="h-5 w-5" />, earned: true, earnedAt: '5 days ago' },
  { id: 'a7', name: 'Perfect Score', description: 'Score 100% on a quiz', icon: <Target className="h-5 w-5" />, earned: false },
  { id: 'a8', name: 'Top Student', description: 'Reach #1 on the leaderboard', icon: <Crown className="h-5 w-5" />, earned: false },
];

const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Sarah Mitchell', avatar: 'SM', points: 4850, coursesCompleted: 8 },
  { rank: 2, name: 'James Cooper', avatar: 'JC', points: 4200, coursesCompleted: 7 },
  { rank: 3, name: 'Mel Briggs', avatar: 'MB', points: 3920, coursesCompleted: 6 },
  { rank: 4, name: 'Ana Torres', avatar: 'AT', points: 3540, coursesCompleted: 6 },
  { rank: 5, name: 'Devon Park', avatar: 'DP', points: 3100, coursesCompleted: 5 },
  { rank: 6, name: 'Riley Chen', avatar: 'RC', points: 2870, coursesCompleted: 5 },
  { rank: 7, name: 'Morgan Blake', avatar: 'MB', points: 2450, coursesCompleted: 4 },
  { rank: 8, name: 'Taylor Reed', avatar: 'TR', points: 2100, coursesCompleted: 3 },
  { rank: 9, name: 'Jordan Hayes', avatar: 'JH', points: 1800, coursesCompleted: 3 },
  { rank: 10, name: 'Casey Lowe', avatar: 'CL', points: 1520, coursesCompleted: 2 },
];

/* ------------------------------------------------------------------ */
/*  Animated Progress Bar                                              */
/* ------------------------------------------------------------------ */

function AnimatedProgressBar({ value, className = '' }: { value: number; className?: string }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-white/[0.06] ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-1000 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AI Tutor Panel                                                     */
/* ------------------------------------------------------------------ */

function AITutorPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: '1',
      role: 'tutor',
      content: 'Hi! I\'m your AI Tutor. I can help you with any lesson, explain concepts, or quiz you on what you\'ve learned. What would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: TutorMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Simulate tutor response
    setTimeout(() => {
      const responses = [
        'Great question! Let me break that down for you. The key concept here is understanding how each component connects to the broader system architecture.',
        'I can see you\'re working on the Digital Marketing Foundations course. This topic ties directly into email segmentation strategies we\'ll cover in the next module.',
        'That\'s a common area of confusion. Think of it this way: workflows are the backbone of automation. Each trigger initiates a chain of actions that execute in sequence.',
        'Excellent thinking! You\'re connecting the dots between marketing funnels and CRM pipelines. That cross-domain understanding is exactly what separates advanced users.',
      ];
      const tutorMessage: TutorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'tutor',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, tutorMessage]);
    }, 1200);
  };

  return (
    <div
      className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-white/[0.06] bg-[#0a0a0f]/95 backdrop-blur-2xl transition-transform duration-300 sm:w-[420px] ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/30 to-red-900/20">
            <GraduationCap className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">AI Tutor</h3>
            <p className="text-xs text-white/40">Context: Digital Marketing Foundations</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-red-500/20 text-white/90'
                    : 'border border-white/[0.06] bg-white/[0.03] text-white/80'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your tutor..."
            className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white/90 placeholder-white/30 outline-none transition-colors focus:border-red-500/40 focus:bg-white/[0.05]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400 transition-all hover:bg-red-500/30 disabled:opacity-30 disabled:hover:bg-red-500/20"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function AcademyPage() {
  const [tutorOpen, setTutorOpen] = useState(false);

  /* ---- API Data ---- */
  const { data: apiPrograms, isError } = useApiQuery<any>(
    ['coaching-programs'],
    '/api/coaching/programs'
  );
  const isDemo = isError || !apiPrograms;

  // If API returns real programs, patch SCHOOLS courseCount
  const schools = useMemo(() => {
    const raw = Array.isArray(apiPrograms) ? apiPrograms : (apiPrograms as any)?.data;
    if (!Array.isArray(raw) || raw.length === 0) return SCHOOLS;
    // Keep the styled School objects, just update counts
    return SCHOOLS.map((s) => ({ ...s, courseCount: raw.length > 0 ? Math.max(raw.length, s.courseCount) : s.courseCount }));
  }, [apiPrograms]);

  // Mock student stats
  const overallCompletion = 48;
  const currentStreak = 5;
  const coursesCompleted = 3;

  return (
    <div className="relative min-h-screen space-y-8 pb-12">
      {isDemo && <DemoBanner reason="No programs from API" />}
      {/* ============================================================ */}
      {/*  TOP: Header + Student Progress                               */}
      {/* ============================================================ */}
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Link href="/dashboard" className="transition-colors hover:text-white/60">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/dashboard/coaching" className="transition-colors hover:text-white/60">Coaching</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white/70">Academy</span>
        </div>

        {/* Title Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/30 to-red-900/20 ring-1 ring-red-500/20">
              <GraduationCap className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Memelli Academy</h1>
              <p className="text-sm text-white/40">AI-powered learning platform</p>
            </div>
          </div>
          <button
            onClick={() => setTutorOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white/70 transition-all hover:border-red-500/30 hover:bg-white/[0.06] hover:text-white/90"
          >
            <MessageCircle className="h-4 w-4 text-red-400" />
            Ask AI Tutor
          </button>
        </div>

        {/* Progress Stats Bar */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            {/* Overall Progress */}
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-white/70">Overall Completion</span>
                <span className="text-sm font-bold tabular-nums text-red-400">{overallCompletion}%</span>
              </div>
              <AnimatedProgressBar value={overallCompletion} />
            </div>

            {/* Divider */}
            <div className="hidden h-10 w-px bg-white/[0.06] sm:block" />

            {/* Streak */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                <Flame className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums text-white">{currentStreak}</p>
                <p className="text-xs text-white/40">Day Streak</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden h-10 w-px bg-white/[0.06] sm:block" />

            {/* Courses Completed */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Award className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums text-white">{coursesCompleted}</p>
                <p className="text-xs text-white/40">Courses Done</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  SECTION 1: Schools Grid                                      */}
      {/* ============================================================ */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white/90">Schools</h2>
          <span className="text-xs text-white/30">{SCHOOLS.length} schools available</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCHOOLS.map((school) => (
            <div
              key={school.id}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              {/* Gradient glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${school.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

              <div className="relative">
                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] ${school.color}`}>
                  {school.icon}
                </div>
                <h3 className="mb-1 text-[15px] font-semibold text-white/90">{school.name}</h3>
                <p className="mb-4 text-xs leading-relaxed text-white/40">{school.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs tabular-nums text-white/30">
                    {school.courseCount} courses
                  </span>
                  <button className="flex items-center gap-1 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/70 transition-all hover:bg-red-500/20 hover:text-red-400">
                    Enter <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 2: My Courses                                        */}
      {/* ============================================================ */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white/90">My Courses</h2>
          <Link href="/dashboard/coaching/enrollments" className="text-xs text-red-400 transition-colors hover:text-red-300">
            View all <ArrowRight className="inline h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {ENROLLED_COURSES.map((course) => (
            <div
              key={course.id}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
                  {course.school}
                </span>
                <span className="text-xs tabular-nums text-white/30">
                  {course.completedLessons}/{course.totalLessons} lessons
                </span>
              </div>
              <h3 className="mb-3 text-[15px] font-semibold text-white/90">{course.title}</h3>
              <AnimatedProgressBar value={course.progress} className="mb-3" />
              <div className="mb-4 flex items-center justify-between text-xs text-white/40">
                <span>{course.progress}% complete</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {course.lastAccessed}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-white/30">Next up</p>
                  <p className="truncate text-xs text-white/60">{course.nextLesson}</p>
                </div>
                <button className="ml-3 shrink-0 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-all hover:bg-red-500/30">
                  Continue
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 3: Featured Course                                   */}
      {/* ============================================================ */}
      <section>
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-red-500/10 via-white/[0.02] to-red-900/10 p-8 backdrop-blur-xl">
          {/* Decorative elements */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/5 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-red-500/5 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
                  Featured
                </span>
                <Star className="h-3.5 w-3.5 text-yellow-400" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-white lg:text-2xl">
                Complete Business Automation Masterclass
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-white/50">
                Learn to build fully automated business systems from scratch. Cover workflows,
                AI agents, CRM automation, marketing funnels, and revenue operations. Transform
                your business into a self-operating machine.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" /> 24 Lessons
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> 8 Hours
                </span>
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" /> Certificate
                </span>
              </div>
            </div>
            <button className="flex shrink-0 items-center gap-2 rounded-xl bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-400 hover:shadow-red-500/30">
              Start Learning <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 5 & 6: Achievements + Leaderboard (side by side)     */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Achievements */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white/90">Achievements</h2>
            <span className="text-xs tabular-nums text-white/30">
              {ACHIEVEMENTS.filter((a) => a.earned).length}/{ACHIEVEMENTS.length} earned
            </span>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ACHIEVEMENTS.map((badge) => (
                <div
                  key={badge.id}
                  className={`group relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200 ${
                    badge.earned
                      ? 'border-red-500/20 bg-red-500/5 hover:border-red-500/30 hover:bg-red-500/10'
                      : 'border-white/[0.04] bg-white/[0.01] opacity-50'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      badge.earned
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-white/[0.04] text-white/20'
                    }`}
                  >
                    {badge.icon}
                  </div>
                  <p className={`text-xs font-medium ${badge.earned ? 'text-white/80' : 'text-white/30'}`}>
                    {badge.name}
                  </p>
                  {badge.earned && badge.earnedAt && (
                    <p className="text-[10px] text-white/30">{badge.earnedAt}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white/90">Leaderboard</h2>
            <span className="text-xs text-white/30">Top 10 Learners</span>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
            <div className="divide-y divide-white/[0.04]">
              {LEADERBOARD.map((entry) => (
                <div
                  key={entry.rank}
                  className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/[0.02]"
                >
                  {/* Rank */}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                    {entry.rank <= 3 ? (
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          entry.rank === 1
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : entry.rank === 2
                              ? 'bg-gray-400/20 text-gray-300'
                              : 'bg-orange-500/20 text-orange-400'
                        }`}
                      >
                        {entry.rank}
                      </div>
                    ) : (
                      <span className="text-xs tabular-nums text-white/30">{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-white/50">
                    {entry.avatar}
                  </div>

                  {/* Name */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white/80">{entry.name}</p>
                    <p className="text-[10px] text-white/30">{entry.coursesCompleted} courses</p>
                  </div>

                  {/* Points */}
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-red-400">
                    {entry.points.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-white/30">pts</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================ */}
      {/*  AI Tutor Panel (Section 4)                                   */}
      {/* ============================================================ */}
      <AITutorPanel isOpen={tutorOpen} onClose={() => setTutorOpen(false)} />

      {/* Overlay when tutor is open */}
      {tutorOpen && (
        <div
          className="fixed inset-0 z-40 bg-background backdrop-blur-sm"
          onClick={() => setTutorOpen(false)}
        />
      )}

      {/* Floating tutor button (mobile) */}
      <button
        onClick={() => setTutorOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/30 transition-all hover:bg-red-400 hover:shadow-red-500/40 lg:hidden"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </button>
    </div>
  );
}
