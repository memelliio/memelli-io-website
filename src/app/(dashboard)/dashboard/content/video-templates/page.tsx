'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Film,
  Play,
  Clock,
  Layers,
  Filter,
  ShoppingBag,
  MessageSquareQuote,
  BookOpen,
  Zap,
  Heart,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

/* ================================================================= */
/*  Types                                                              */
/* ================================================================= */

type TemplateCategory = 'all' | 'marketing' | 'social' | 'educational' | 'brand' | 'event';

interface VideoTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  duration: number;
  sceneCount: number;
  description: string;
  prompt: string;
  style: string;
  icon: React.ReactNode;
  gradient: string;
  accentColor: string;
}

/* ================================================================= */
/*  Constants                                                          */
/* ================================================================= */

const CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: 'all', label: 'All Templates' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'social', label: 'Social' },
  { id: 'educational', label: 'Educational' },
  { id: 'brand', label: 'Brand' },
  { id: 'event', label: 'Event' },
];

const TEMPLATES: VideoTemplate[] = [
  {
    id: 'tpl-product-promo',
    name: 'Product Promo',
    category: 'marketing',
    duration: 30,
    sceneCount: 5,
    description:
      'Fast-paced product showcase with dynamic transitions, feature highlights, price callout, and a strong CTA. Perfect for ads and landing pages.',
    prompt:
      'Product showcase video with dynamic zoom transitions highlighting key features, benefit callouts with text overlays, pricing reveal, and a strong call-to-action ending',
    style: 'cinematic',
    icon: <ShoppingBag className="h-5 w-5" />,
    gradient: 'from-amber-500/20 to-orange-500/20',
    accentColor: 'text-amber-400',
  },
  {
    id: 'tpl-testimonial',
    name: 'Testimonial',
    category: 'brand',
    duration: 60,
    sceneCount: 6,
    description:
      'Client success story with intro, quote highlight, before/after context, results metrics, and brand sign-off. Builds trust and social proof.',
    prompt:
      'Customer testimonial video with speaker introduction, quote highlight with subtle text animation, before and after context, results and metrics display, brand logo sign-off',
    style: 'corporate',
    icon: <MessageSquareQuote className="h-5 w-5" />,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    accentColor: 'text-blue-400',
  },
  {
    id: 'tpl-how-to',
    name: 'How-To Tutorial',
    category: 'educational',
    duration: 90,
    sceneCount: 8,
    description:
      'Step-by-step walkthrough with intro hook, numbered steps, screen recordings, tips callouts, and summary recap. Great for onboarding and education.',
    prompt:
      'How-to tutorial video with attention-grabbing intro, numbered step-by-step instructions with visual demonstrations, pro tips callout boxes, and a summary recap with next steps',
    style: 'explainer',
    icon: <BookOpen className="h-5 w-5" />,
    gradient: 'from-emerald-500/20 to-teal-500/20',
    accentColor: 'text-emerald-400',
  },
  {
    id: 'tpl-social-reel',
    name: 'Social Reel',
    category: 'social',
    duration: 15,
    sceneCount: 3,
    description:
      'Punchy vertical-format clip with hook text, quick visual burst, and CTA overlay. Optimized for Instagram Reels, TikTok, and YouTube Shorts.',
    prompt:
      'Short-form social reel with bold hook text in first 2 seconds, fast-cut visual sequence with trending transitions, and swipe-up CTA overlay',
    style: 'playful',
    icon: <Zap className="h-5 w-5" />,
    gradient: 'from-pink-500/20 to-rose-500/20',
    accentColor: 'text-pink-400',
  },
  {
    id: 'tpl-brand-story',
    name: 'Brand Story',
    category: 'brand',
    duration: 60,
    sceneCount: 7,
    description:
      'Emotional narrative arc with origin moment, mission statement, team/culture footage, impact showcase, and future vision. Tells your brand story.',
    prompt:
      'Brand story video with cinematic opening, origin narrative, mission statement with elegant typography, team and culture montage, customer impact showcase, future vision statement, logo reveal',
    style: 'luxury',
    icon: <Heart className="h-5 w-5" />,
    gradient: 'from-purple-500/20 to-violet-500/20',
    accentColor: 'text-primary',
  },
  {
    id: 'tpl-event-announcement',
    name: 'Event Announcement',
    category: 'event',
    duration: 30,
    sceneCount: 4,
    description:
      'High-energy event promo with date/time reveal, speaker or lineup highlights, venue showcase, and registration CTA. Drives signups.',
    prompt:
      'Event announcement video with dramatic countdown reveal, date and time with animated typography, speaker lineup or event highlights, venue teaser, and registration call-to-action with urgency',
    style: 'cinematic',
    icon: <CalendarDays className="h-5 w-5" />,
    gradient: 'from-red-500/20 to-orange-500/20',
    accentColor: 'text-red-400',
  },
];

/* ================================================================= */
/*  Helpers                                                            */
/* ================================================================= */

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

/* ================================================================= */
/*  Page Component                                                     */
/* ================================================================= */

export default function VideoTemplatesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('all');

  const filteredTemplates =
    activeCategory === 'all'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeCategory);

  const handleUseTemplate = useCallback(
    (template: VideoTemplate) => {
      const params = new URLSearchParams({
        prompt: template.prompt,
        style: template.style,
        duration: String(template.duration),
        template: template.id,
      });
      router.push(`/dashboard/content/media-studio?${params.toString()}`);
    },
    [router],
  );

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/10">
              <Film className="h-5 w-5 text-red-400" />
            </div>
            Video Templates
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Pre-built video templates ready to customize in Media Studio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground mr-1" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition-all duration-200 ${
              activeCategory === cat.id
                ? 'border-red-500/30 bg-red-500/[0.08] text-red-300'
                : 'border-white/[0.04] bg-white/[0.02] text-muted-foreground hover:border-white/[0.08] hover:bg-white/[0.03]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden group hover:border-white/[0.08] transition-all duration-200"
          >
            {/* Thumbnail Area */}
            <div
              className={`relative aspect-video bg-gradient-to-br ${template.gradient} flex items-center justify-center`}
            >
              <div className="absolute inset-0 bg-background" />
              <div className="relative flex flex-col items-center gap-2">
                <div className={`${template.accentColor} opacity-60 group-hover:opacity-100 transition-opacity duration-200`}>
                  {template.icon}
                </div>
                <Play className={`h-10 w-10 ${template.accentColor} opacity-40 group-hover:opacity-80 transition-opacity duration-200`} />
              </div>

              {/* Duration badge */}
              <span className="absolute bottom-2.5 right-2.5 rounded-md bg-background px-2 py-0.5 text-[10px] font-mono text-foreground backdrop-blur-sm">
                {formatDuration(template.duration)}
              </span>

              {/* Scene count badge */}
              <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md bg-background px-2 py-0.5 text-[10px] font-mono text-foreground backdrop-blur-sm">
                <Layers className="h-2.5 w-2.5" />
                {template.sceneCount} scenes
              </span>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {template.name}
                </h3>
                <span className="shrink-0 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-muted-foreground capitalize">
                  {template.category}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                {template.description}
              </p>

              {/* Meta row */}
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDuration(template.duration)}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Layers className="h-3 w-3" />
                  {template.sceneCount} scenes
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  {template.style}
                </span>
              </div>

              {/* Use Template Button */}
              <button
                onClick={() => handleUseTemplate(template)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-2.5 text-sm font-medium text-white hover:from-red-500 hover:to-red-400 transition-all duration-200"
              >
                <Film className="h-4 w-4" />
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl py-16 text-center">
          <Film className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">No templates in this category</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different filter</p>
        </div>
      )}
    </div>
  );
}
