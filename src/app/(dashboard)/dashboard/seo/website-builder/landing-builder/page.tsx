'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import {
  Layout,
  Type,
  Star,
  DollarSign,
  MousePointerClick,
  HelpCircle,
  FileText,
  Video,
  Image,
  BarChart3,
  Users,
  Mail,
  Plus,
  X,
  GripVertical,
  Save,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Palette,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  Layers,
  Trash2,
  Settings,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type BlockType =
  | 'hero'
  | 'features'
  | 'testimonials'
  | 'pricing'
  | 'cta'
  | 'faq'
  | 'form'
  | 'video'
  | 'gallery'
  | 'stats'
  | 'team'
  | 'contact';

interface BlockData {
  id: string;
  type: BlockType;
  heading: string;
  subheading: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  imageUrl: string;
  bgColor: string;
  textColor: string;
  items: Array<{ title: string; description: string }>;
}

type ViewMode = 'desktop' | 'tablet' | 'mobile';

interface ColorTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
}

interface Template {
  name: string;
  description: string;
  blocks: Omit<BlockData, 'id'>[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BLOCK_LIBRARY: { type: BlockType; label: string; icon: typeof Layout }[] = [
  { type: 'hero', label: 'Hero', icon: Layout },
  { type: 'features', label: 'Features', icon: Layers },
  { type: 'testimonials', label: 'Testimonials', icon: Star },
  { type: 'pricing', label: 'Pricing', icon: DollarSign },
  { type: 'cta', label: 'CTA', icon: MousePointerClick },
  { type: 'faq', label: 'FAQ', icon: HelpCircle },
  { type: 'form', label: 'Form', icon: FileText },
  { type: 'video', label: 'Video', icon: Video },
  { type: 'gallery', label: 'Gallery', icon: Image },
  { type: 'stats', label: 'Stats', icon: BarChart3 },
  { type: 'team', label: 'Team', icon: Users },
  { type: 'contact', label: 'Contact', icon: Mail },
];

const COLOR_THEMES: ColorTheme[] = [
  { name: 'Midnight', primary: '#f59e0b', secondary: '#1e1b4b', accent: '#818cf8', bg: '#0f0f23', text: '#e2e8f0' },
  { name: 'Ocean', primary: '#0ea5e9', secondary: '#0c4a6e', accent: '#38bdf8', bg: '#f0f9ff', text: '#0c4a6e' },
  { name: 'Forest', primary: '#22c55e', secondary: '#14532d', accent: '#4ade80', bg: '#f0fdf4', text: '#14532d' },
  { name: 'Sunset', primary: '#f97316', secondary: '#7c2d12', accent: '#fb923c', bg: '#fff7ed', text: '#431407' },
  { name: 'Rose', primary: '#f43f5e', secondary: '#4c0519', accent: '#fb7185', bg: '#fff1f2', text: '#4c0519' },
];

const DEFAULT_BLOCK_DATA: Record<BlockType, Omit<BlockData, 'id' | 'type'>> = {
  hero: {
    heading: 'Welcome to Our Platform',
    subheading: 'The modern solution for modern teams',
    body: 'Build, scale, and grow your business with our all-in-one platform designed for ambitious companies.',
    buttonText: 'Get Started',
    buttonUrl: '#signup',
    imageUrl: '',
    bgColor: '#f59e0b',
    textColor: '#ffffff',
    items: [],
  },
  features: {
    heading: 'Powerful Features',
    subheading: 'Everything you need to succeed',
    body: '',
    buttonText: '',
    buttonUrl: '',
    imageUrl: '',
    bgColor: '#ffffff',
    textColor: '#1e293b',
    items: [
      { title: 'Fast Performance', description: 'Lightning-fast load times and smooth interactions.' },
      { title: 'Secure by Default', description: 'Enterprise-grade security built into every layer.' },
      { title: 'Easy Integration', description: 'Connect with your favorite tools in minutes.' },
    ],
  },
  testimonials: {
    heading: 'What Our Customers Say',
    subheading: '',
    body: '',
    buttonText: '',
    buttonUrl: '',
    imageUrl: '',
    bgColor: '#f8fafc',
    textColor: '#1e293b',
    items: [
      { title: 'Sarah M.', description: '"This platform transformed our workflow. Highly recommended!"' },
      { title: 'James K.', description: '"The best investment we made for our business this year."' },
      { title: 'Lisa R.', description: '"Outstanding support and incredible features. 5 stars."' },
    ],
  },
  pricing: {
    heading: 'Simple, Transparent Pricing',
    subheading: 'Choose the plan that works for you',
    body: '',
    buttonText: 'Start Free Trial',
    buttonUrl: '#pricing',
    imageUrl: '',
    bgColor: '#ffffff',
    textColor: '#1e293b',
    items: [
      { title: 'Starter - $29/mo', description: 'Perfect for individuals and small teams getting started.' },
      { title: 'Pro - $79/mo', description: 'Advanced features for growing businesses.' },
      { title: 'Enterprise - Custom', description: 'Tailored solutions for large organizations.' },
    ],
  },
  cta: {
    heading: 'Ready to Get Started?',
    subheading: 'Join thousands of happy customers today',
    body: 'Start your free 14-day trial. No credit card required.',
    buttonText: 'Start Free Trial',
    buttonUrl: '#signup',
    imageUrl: '',
    bgColor: '#f59e0b',
    textColor: '#ffffff',
    items: [],
  },
  faq: {
    heading: 'Frequently Asked Questions',
    subheading: '',
    body: '',
    buttonText: '',
    buttonUrl: '',
    imageUrl: '',
    bgColor: '#ffffff',
    textColor: '#1e293b',
    items: [
      { title: 'How does the free trial work?', description: 'You get full access for 14 days, no credit card required.' },
      { title: 'Can I cancel anytime?', description: 'Yes, you can cancel your subscription at any time with no penalties.' },
      { title: 'Do you offer support?', description: 'We offer 24/7 support via chat, email, and phone.' },
    ],
  },
  form: {
    heading: 'Get in Touch',
    subheading: 'Fill out the form and we will get back to you',
    body: '',
    buttonText: 'Submit',
    buttonUrl: '',
    imageUrl: '',
    bgColor: '#f8fafc',
    textColor: '#1e293b',
    items: [
      { title: 'Name', description: 'text' },
      { title: 'Email', description: 'email' },
      { title: 'Message', description: 'textarea' },
    ],
  },
  video: {
    heading: 'See It in Action',
    subheading: 'Watch our 2-minute demo',
    body: '',
    buttonText: '',
    buttonUrl: '',
    imageUrl: '',
    bgColor: '#0f172a',
    textColor: '#ffffff',
    items: [],
  },
  gallery: {
    heading: 'Our Work',
    subheading: 'A showcase of what we have built',
    body: '',
    buttonText: '',
    buttonUrl: '',
    imageUrl: '',
    bgColor: '#ffffff',
    textColor: '#1e293b',
    items: [
      { title: 'Project Alpha', description: 'A complete redesign for a fintech company.' },
      { title: 'Project Beta', description: 'E-commerce platform with custom checkout.' },
      { title: 'Project Gamma', description: 'SaaS dashboard with real-time analytics.' },
    ],
  },
  stats: {
    heading: 'Our Impact',
    subheading: '',
    body: '',
    buttonText: '',
    buttonUrl: '',
    imageUrl: '',
    bgColor: '#f59e0b',
    textColor: '#ffffff',
    items: [
      { title: '10,000+', description: 'Active Users' },
      { title: '99.9%', description: 'Uptime' },
      { title: '150+', description: 'Countries' },
      { title: '4.9/5', description: 'Rating' },
    ],
  },
  team: {
    heading: 'Meet Our Team',
    subheading: 'The people behind the product',
    body: '',
    buttonText: '',
    buttonUrl: '',
    imageUrl: '',
    bgColor: '#ffffff',
    textColor: '#1e293b',
    items: [
      { title: 'Alex Chen', description: 'CEO & Co-Founder' },
      { title: 'Maria Santos', description: 'CTO' },
      { title: 'David Kim', description: 'Head of Design' },
    ],
  },
  contact: {
    heading: 'Contact Us',
    subheading: 'We would love to hear from you',
    body: 'Email: hello@example.com\nPhone: (555) 123-4567\nAddress: 123 Main St, Suite 100',
    buttonText: 'Send Message',
    buttonUrl: '#contact',
    imageUrl: '',
    bgColor: '#f8fafc',
    textColor: '#1e293b',
    items: [],
  },
};

const TEMPLATES: Template[] = [
  {
    name: 'SaaS Landing',
    description: 'Perfect for software products and SaaS platforms',
    blocks: [
      { ...DEFAULT_BLOCK_DATA.hero, type: 'hero' as BlockType },
      { ...DEFAULT_BLOCK_DATA.features, type: 'features' as BlockType },
      { ...DEFAULT_BLOCK_DATA.stats, type: 'stats' as BlockType },
      { ...DEFAULT_BLOCK_DATA.testimonials, type: 'testimonials' as BlockType },
      { ...DEFAULT_BLOCK_DATA.pricing, type: 'pricing' as BlockType },
      { ...DEFAULT_BLOCK_DATA.faq, type: 'faq' as BlockType },
      { ...DEFAULT_BLOCK_DATA.cta, type: 'cta' as BlockType },
    ],
  },
  {
    name: 'Agency Landing',
    description: 'Showcase your agency services and portfolio',
    blocks: [
      { ...DEFAULT_BLOCK_DATA.hero, type: 'hero' as BlockType, heading: 'We Build Digital Experiences', subheading: 'Award-winning agency for ambitious brands' },
      { ...DEFAULT_BLOCK_DATA.features, type: 'features' as BlockType, heading: 'Our Services' },
      { ...DEFAULT_BLOCK_DATA.gallery, type: 'gallery' as BlockType },
      { ...DEFAULT_BLOCK_DATA.team, type: 'team' as BlockType },
      { ...DEFAULT_BLOCK_DATA.testimonials, type: 'testimonials' as BlockType },
      { ...DEFAULT_BLOCK_DATA.contact, type: 'contact' as BlockType },
    ],
  },
  {
    name: 'Product Launch',
    description: 'Build hype for your upcoming product launch',
    blocks: [
      { ...DEFAULT_BLOCK_DATA.hero, type: 'hero' as BlockType, heading: 'Something Big is Coming', subheading: 'Be the first to experience it', buttonText: 'Join Waitlist' },
      { ...DEFAULT_BLOCK_DATA.video, type: 'video' as BlockType },
      { ...DEFAULT_BLOCK_DATA.features, type: 'features' as BlockType, heading: 'Why You Will Love It' },
      { ...DEFAULT_BLOCK_DATA.stats, type: 'stats' as BlockType },
      { ...DEFAULT_BLOCK_DATA.cta, type: 'cta' as BlockType, heading: 'Do Not Miss Out', buttonText: 'Join Waitlist' },
    ],
  },
  {
    name: 'Event Registration',
    description: 'Drive registrations for your next event',
    blocks: [
      { ...DEFAULT_BLOCK_DATA.hero, type: 'hero' as BlockType, heading: 'Annual Conference 2026', subheading: 'March 25-27 | San Francisco', buttonText: 'Register Now' },
      { ...DEFAULT_BLOCK_DATA.features, type: 'features' as BlockType, heading: 'What to Expect', items: [{ title: 'Keynote Speakers', description: 'Industry leaders sharing their insights.' }, { title: 'Workshops', description: 'Hands-on sessions to level up your skills.' }, { title: 'Networking', description: 'Connect with 500+ professionals.' }] },
      { ...DEFAULT_BLOCK_DATA.team, type: 'team' as BlockType, heading: 'Speakers' },
      { ...DEFAULT_BLOCK_DATA.faq, type: 'faq' as BlockType },
      { ...DEFAULT_BLOCK_DATA.form, type: 'form' as BlockType, heading: 'Register Now' },
    ],
  },
  {
    name: 'Lead Magnet',
    description: 'Capture leads with a free resource offer',
    blocks: [
      { ...DEFAULT_BLOCK_DATA.hero, type: 'hero' as BlockType, heading: 'Free Guide: 10x Your Growth', subheading: 'Download our proven playbook', buttonText: 'Download Free' },
      { ...DEFAULT_BLOCK_DATA.features, type: 'features' as BlockType, heading: 'What You Will Learn' },
      { ...DEFAULT_BLOCK_DATA.testimonials, type: 'testimonials' as BlockType },
      { ...DEFAULT_BLOCK_DATA.form, type: 'form' as BlockType, heading: 'Get Your Free Copy' },
    ],
  },
];

const AI_CONTENT: Record<string, Partial<Record<BlockType, Partial<Omit<BlockData, 'id'>>>>> = {
  'SaaS Landing': {
    hero: { heading: 'Ship Faster, Scale Smarter', subheading: 'The developer platform that grows with your ambition', body: 'Automate deployments, monitor performance, and scale globally with zero DevOps overhead. Trusted by 10,000+ teams.' },
    features: { heading: 'Built for Speed', items: [{ title: 'One-Click Deploy', description: 'Push to production in seconds with automatic CI/CD pipelines.' }, { title: 'Global Edge Network', description: 'Your app served from 200+ locations worldwide.' }, { title: 'Real-Time Analytics', description: 'Monitor every metric that matters with live dashboards.' }] },
    cta: { heading: 'Start Building Today', body: 'Join 10,000+ teams already shipping faster. Free tier available.' },
  },
  'Agency Landing': {
    hero: { heading: 'We Turn Ideas Into Digital Reality', subheading: 'Strategy. Design. Development. Results.', body: 'A full-service digital agency helping ambitious brands grow with purposeful design and smart technology.' },
    features: { heading: 'What We Do Best', items: [{ title: 'Brand Strategy', description: 'We craft brand identities that resonate and endure.' }, { title: 'Web Development', description: 'Custom-built websites that perform and convert.' }, { title: 'Growth Marketing', description: 'Data-driven campaigns that deliver measurable ROI.' }] },
  },
  'Product Launch': {
    hero: { heading: 'The Future of Productivity is Here', subheading: 'Launching March 2026', body: 'An AI-powered workspace that anticipates your needs and eliminates busywork. Be among the first to try it.' },
    features: { heading: 'Game-Changing Features', items: [{ title: 'AI Auto-Complete', description: 'Finish tasks before you even start them.' }, { title: 'Smart Scheduling', description: 'Your calendar, optimized by machine learning.' }, { title: 'Team Sync', description: 'Real-time collaboration without the chaos.' }] },
  },
  'Event Registration': {
    hero: { heading: 'GrowthCon 2026', subheading: 'The Premier Growth Marketing Conference | April 15-17, Austin TX', body: '3 days of actionable insights from the world\'s top growth leaders. Limited to 500 attendees.' },
    features: { heading: 'Conference Highlights', items: [{ title: '30+ Expert Speakers', description: 'Learn from leaders at top tech companies.' }, { title: 'Interactive Workshops', description: 'Roll up your sleeves in hands-on breakout sessions.' }, { title: 'VIP Networking', description: 'Exclusive dinners and after-hours events.' }] },
  },
  'Lead Magnet': {
    hero: { heading: 'The Ultimate Growth Playbook', subheading: 'Free 47-page guide used by 5,000+ marketers', body: 'Learn the exact strategies that helped our clients generate $10M+ in revenue last year.' },
    features: { heading: 'Inside the Playbook', items: [{ title: 'Chapter 1: Foundation', description: 'Set up your growth engine with proven frameworks.' }, { title: 'Chapter 2: Acquisition', description: 'Master paid and organic channels that actually convert.' }, { title: 'Chapter 3: Retention', description: 'Keep customers coming back with data-driven strategies.' }] },
  },
};

/* ------------------------------------------------------------------ */
/*  Utility                                                            */
/* ------------------------------------------------------------------ */

let _blockCounter = 0;
function uid(): string {
  _blockCounter += 1;
  return `block_${Date.now()}_${_blockCounter}`;
}

/* ------------------------------------------------------------------ */
/*  Block Preview Components                                           */
/* ------------------------------------------------------------------ */

function HeroPreview({ block }: { block: BlockData }) {
  return (
    <div style={{ background: block.bgColor, color: block.textColor }} className="px-8 py-20 text-center">
      <h1 className="text-4xl font-bold mb-3">{block.heading}</h1>
      <p className="text-xl opacity-80 mb-4">{block.subheading}</p>
      <p className="max-w-xl mx-auto opacity-70 mb-8 text-sm">{block.body}</p>
      {block.buttonText && (
        <button className="px-6 py-3 rounded-lg font-semibold text-sm" style={{ background: 'rgba(255,255,255,0.2)', color: block.textColor, border: '1px solid rgba(255,255,255,0.3)' }}>
          {block.buttonText}
        </button>
      )}
    </div>
  );
}

function FeaturesPreview({ block }: { block: BlockData }) {
  return (
    <div style={{ background: block.bgColor, color: block.textColor }} className="px-8 py-16">
      <h2 className="text-2xl font-bold text-center mb-2">{block.heading}</h2>
      <p className="text-center opacity-70 mb-10 text-sm">{block.subheading}</p>
      <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
        {block.items.map((item, i) => (
          <div key={i} className="text-center p-4">
            <div className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center text-lg" style={{ background: 'rgba(99,102,241,0.15)' }}>
              {['1', '2', '3', '4', '5', '6'][i] || (i + 1)}
            </div>
            <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
            <p className="text-xs opacity-60">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialsPreview({ block }: { block: BlockData }) {
  return (
    <div style={{ background: block.bgColor, color: block.textColor }} className="px-8 py-16">
      <h2 className="text-2xl font-bold text-center mb-10">{block.heading}</h2>
      <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
        {block.items.map((item, i) => (
          <div key={i} className="p-5 rounded-xl" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <p className="text-sm italic mb-3 opacity-80">{item.description}</p>
            <p className="text-xs font-semibold">{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingPreview({ block }: { block: BlockData }) {
  return (
    <div style={{ background: block.bgColor, color: block.textColor }} className="px-8 py-16">
      <h2 className="text-2xl font-bold text-center mb-2">{block.heading}</h2>
      <p className="text-center opacity-70 mb-10 text-sm">{block.subheading}</p>
      <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
        {block.items.map((item, i) => (
          <div key={i} className="p-6 rounded-xl text-center border" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
            <h3 className="font-bold text-lg mb-2">{item.title}</h3>
            <p className="text-xs opacity-60 mb-4">{item.description}</p>
            {block.buttonText && (
              <button className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: '#f59e0b', color: '#fff' }}>
                {block.buttonText}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CTAPreview({ block }: { block: BlockData }) {
  return (
    <div style={{ background: block.bgColor, color: block.textColor }} className="px-8 py-16 text-center">
      <h2 className="text-3xl font-bold mb-3">{block.heading}</h2>
      <p className="opacity-80 mb-2">{block.subheading}</p>
      <p className="text-sm opacity-60 mb-8">{block.body}</p>
      {block.buttonText && (
        <button className="px-6 py-3 rounded-lg font-semibold text-sm" style={{ background: 'rgba(255,255,255,0.2)', color: block.textColor, border: '1px solid rgba(255,255,255,0.3)' }}>
          {block.buttonText}
        </button>
      )}
    </div>
  );
}

function FAQPreview({ block }: { block: BlockData }) {
  return (
    <div style={{ background: block.bgColor, color: block.textColor }} className="px-8 py-16">
      <h2 className="text-2xl font-bold text-center mb-10">{block.heading}</h2>
      <div className="max-w-2xl mx-auto space-y-4">
        {block.items.map((item, i) => (
          <div key={i} className="p-4 rounded-lg" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
            <p className="text-xs opacity-60">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormPreview({ block }: { block: BlockData }) {
  return (
    <div style={{ background: block.bgColor, color: block.textColor }} className="px-8 py-16">
      <h2 className="text-2xl font-bold text-center mb-2">{block.heading}</h2>
      <p className="text-center opacity-70 mb-8 text-sm">{block.subheading}</p>
      <div className="max-w-md mx-auto space-y-4">
        {block.items.map((item, i) => (
          <div key={i}>
            <label className="text-xs font-medium mb-1 block opacity-70">{item.title}</label>
            {item.description === 'textarea' ? (
              <div className="w-full h-20 rounded-lg border" style={{ borderColor: 'rgba(0,0,0,0.15)', background: 'rgba(255,255,255,0.5)' }} />
            ) : (
              <div className="w-full h-10 rounded-lg border" style={{ borderColor: 'rgba(0,0,0,0.15)', background: 'rgba(255,255,255,0.5)' }} />
            )}
          </div>
        ))}
        {block.buttonText && (
          <button className="w-full px-4 py-3 rounded-lg text-sm font-semibold" style={{ background: '#f59e0b', color: '#fff' }}>
            {block.buttonText}
          </button>
        )}
      </div>
    </div>
  );
}

function VideoPreview({ block }: { block: BlockData }) {
  return (
    <div style={{ background: block.bgColor, color: block.textColor }} className="px-8 py-16 text-center">
      <h2 className="text-2xl font-bold mb-2">{block.heading}</h2>
      <p className="opacity-70 mb-8 text-sm">{block.subheading}</p>
      <div className="max-w-2xl mx-auto aspect-video rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <Video className="w-16 h-16 opacity-40" />
      </div>
    </div>
  );
}

function GalleryPreview({ block }: { block: BlockData }) {
  return (
    <div style={{ background: block.bgColor, color: block.textColor }} className="px-8 py-16">
      <h2 className="text-2xl font-bold text-center mb-2">{block.heading}</h2>
      <p className="text-center opacity-70 mb-10 text-sm">{block.subheading}</p>
      <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
        {block.items.map((item, i) => (
          <div key={i} className="aspect-square rounded-xl flex flex-col items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.06)' }}>
            <Image className="w-8 h-8 opacity-30 mb-2" />
            <p className="text-xs font-medium">{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsPreview({ block }: { block: BlockData }) {
  return (
    <div style={{ background: block.bgColor, color: block.textColor }} className="px-8 py-16">
      <h2 className="text-2xl font-bold text-center mb-10">{block.heading}</h2>
      <div className="grid grid-cols-4 gap-6 max-w-3xl mx-auto text-center">
        {block.items.map((item, i) => (
          <div key={i}>
            <p className="text-3xl font-bold mb-1">{item.title}</p>
            <p className="text-xs opacity-60">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamPreview({ block }: { block: BlockData }) {
  return (
    <div style={{ background: block.bgColor, color: block.textColor }} className="px-8 py-16">
      <h2 className="text-2xl font-bold text-center mb-2">{block.heading}</h2>
      <p className="text-center opacity-70 mb-10 text-sm">{block.subheading}</p>
      <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto text-center">
        {block.items.map((item, i) => (
          <div key={i}>
            <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <Users className="w-6 h-6 opacity-50" />
            </div>
            <p className="font-semibold text-sm">{item.title}</p>
            <p className="text-xs opacity-60">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactPreview({ block }: { block: BlockData }) {
  return (
    <div style={{ background: block.bgColor, color: block.textColor }} className="px-8 py-16">
      <h2 className="text-2xl font-bold text-center mb-2">{block.heading}</h2>
      <p className="text-center opacity-70 mb-8 text-sm">{block.subheading}</p>
      <div className="max-w-md mx-auto text-center">
        <p className="text-sm whitespace-pre-line opacity-70 mb-6">{block.body}</p>
        {block.buttonText && (
          <button className="px-6 py-3 rounded-lg text-sm font-semibold" style={{ background: '#f59e0b', color: '#fff' }}>
            {block.buttonText}
          </button>
        )}
      </div>
    </div>
  );
}

const BLOCK_PREVIEWS: Record<BlockType, React.ComponentType<{ block: BlockData }>> = {
  hero: HeroPreview,
  features: FeaturesPreview,
  testimonials: TestimonialsPreview,
  pricing: PricingPreview,
  cta: CTAPreview,
  faq: FAQPreview,
  form: FormPreview,
  video: VideoPreview,
  gallery: GalleryPreview,
  stats: StatsPreview,
  team: TeamPreview,
  contact: ContactPreview,
};

/* ------------------------------------------------------------------ */
/*  Block Editor Panel                                                 */
/* ------------------------------------------------------------------ */

function BlockEditorPanel({
  block,
  onUpdate,
  onClose,
}: {
  block: BlockData;
  onUpdate: (updated: BlockData) => void;
  onClose: () => void;
}) {
  const update = (patch: Partial<BlockData>) => onUpdate({ ...block, ...patch });
  const updateItem = (idx: number, patch: Partial<{ title: string; description: string }>) => {
    const newItems = [...block.items];
    newItems[idx] = { ...newItems[idx], ...patch };
    update({ items: newItems });
  };
  const addItem = () => update({ items: [...block.items, { title: 'New Item', description: 'Description here' }] });
  const removeItem = (idx: number) => update({ items: block.items.filter((_, i) => i !== idx) });

  return (
    <div className="w-80 bg-[#1a1a2e] border-l border-gray-700/50 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <h3 className="text-sm font-semibold text-white capitalize flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-400" />
          Edit {block.type}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Field label="Heading" value={block.heading} onChange={(v) => update({ heading: v })} />
        <Field label="Subheading" value={block.subheading} onChange={(v) => update({ subheading: v })} />
        <FieldArea label="Body Text" value={block.body} onChange={(v) => update({ body: v })} />
        <Field label="Button Text" value={block.buttonText} onChange={(v) => update({ buttonText: v })} />
        <Field label="Button URL" value={block.buttonUrl} onChange={(v) => update({ buttonUrl: v })} />
        <Field label="Image URL" value={block.imageUrl} onChange={(v) => update({ imageUrl: v })} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 block">Bg Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={block.bgColor}
                onChange={(e) => update({ bgColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={block.bgColor}
                onChange={(e) => update({ bgColor: e.target.value })}
                className="flex-1 bg-[#0f0f23] border border-gray-700/50 rounded px-2 py-1 text-xs text-gray-300 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 block">Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={block.textColor}
                onChange={(e) => update({ textColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={block.textColor}
                onChange={(e) => update({ textColor: e.target.value })}
                className="flex-1 bg-[#0f0f23] border border-gray-700/50 rounded px-2 py-1 text-xs text-gray-300 font-mono"
              />
            </div>
          </div>
        </div>

        {block.items.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-wider text-gray-400">Items</label>
              <button onClick={addItem} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-3">
              {block.items.map((item, i) => (
                <div key={i} className="bg-[#0f0f23] rounded-lg p-3 relative group">
                  <button
                    onClick={() => removeItem(i)}
                    className="absolute top-2 right-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <input
                    value={item.title}
                    onChange={(e) => updateItem(i, { title: e.target.value })}
                    className="w-full bg-transparent text-xs text-gray-200 font-medium mb-1 outline-none"
                    placeholder="Title"
                  />
                  <textarea
                    value={item.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                    className="w-full bg-transparent text-[11px] text-gray-400 outline-none resize-none"
                    rows={2}
                    placeholder="Description"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        {block.items.length === 0 && (
          <button
            onClick={addItem}
            className="w-full py-2 text-xs text-gray-400 hover:text-indigo-400 border border-dashed border-gray-700 rounded-lg hover:border-indigo-500/50 transition-colors"
          >
            + Add Items
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0f0f23] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500/50 transition-colors"
      />
    </div>
  );
}

function FieldArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full bg-[#0f0f23] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none resize-none focus:border-indigo-500/50 transition-colors"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Template Gallery Modal                                             */
/* ------------------------------------------------------------------ */

function TemplateGallery({
  onSelect,
  onClose,
}: {
  onSelect: (blocks: BlockData[]) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm">
      <div className="bg-[#1a1a2e] rounded-2xl border border-gray-700/50 w-[720px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
          <h2 className="text-lg font-semibold text-white">Template Gallery</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4 overflow-y-auto max-h-[60vh]">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              onClick={() => {
                const blocks: BlockData[] = tpl.blocks.map((b) => ({
                  ...b,
                  id: uid(),
                }));
                onSelect(blocks);
                onClose();
              }}
              className="text-left p-5 rounded-xl border border-gray-700/50 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-sm text-white group-hover:text-indigo-300">{tpl.name}</h3>
              </div>
              <p className="text-xs text-gray-400 mb-3">{tpl.description}</p>
              <div className="flex flex-wrap gap-1">
                {tpl.blocks.map((b, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-gray-400 capitalize">
                    {b.type}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function LandingBuilderPage() {
  const [pageName, setPageName] = useState('My Landing Page');
  const [urlSlug, setUrlSlug] = useState('my-landing-page');
  const [published, setPublished] = useState(false);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [activeTheme, setActiveTheme] = useState(0);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragSourceRef = useRef<{ type: 'library' | 'canvas'; blockType?: BlockType; blockId?: string } | null>(null);

  const selectedBlock = useMemo(
    () => (selectedBlockId ? blocks.find((b) => b.id === selectedBlockId) || null : null),
    [blocks, selectedBlockId]
  );

  /* ---- Drag from library ---- */
  const handleLibraryDragStart = useCallback((e: React.DragEvent, type: BlockType) => {
    dragSourceRef.current = { type: 'library', blockType: type };
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', type);
  }, []);

  /* ---- Drag from canvas (reorder) ---- */
  const handleCanvasDragStart = useCallback((e: React.DragEvent, blockId: string) => {
    dragSourceRef.current = { type: 'canvas', blockId };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', blockId);
  }, []);

  const handleCanvasDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = dragSourceRef.current?.type === 'library' ? 'copy' : 'move';
    setDragOverIndex(index);
  }, []);

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      setDragOverIndex(null);

      const source = dragSourceRef.current;
      if (!source) return;

      if (source.type === 'library' && source.blockType) {
        const defaults = DEFAULT_BLOCK_DATA[source.blockType];
        const newBlock: BlockData = {
          id: uid(),
          type: source.blockType,
          ...defaults,
        };
        setBlocks((prev) => {
          const next = [...prev];
          next.splice(dropIndex, 0, newBlock);
          return next;
        });
        setSelectedBlockId(newBlock.id);
      } else if (source.type === 'canvas' && source.blockId) {
        setBlocks((prev) => {
          const srcIdx = prev.findIndex((b) => b.id === source.blockId);
          if (srcIdx === -1 || srcIdx === dropIndex) return prev;
          const next = [...prev];
          const [moved] = next.splice(srcIdx, 1);
          const adjustedIdx = dropIndex > srcIdx ? dropIndex - 1 : dropIndex;
          next.splice(adjustedIdx, 0, moved);
          return next;
        });
      }

      dragSourceRef.current = null;
    },
    []
  );

  const handleCanvasRootDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverIndex(null);

      const source = dragSourceRef.current;
      if (!source) return;

      if (source.type === 'library' && source.blockType) {
        const defaults = DEFAULT_BLOCK_DATA[source.blockType];
        const newBlock: BlockData = {
          id: uid(),
          type: source.blockType,
          ...defaults,
        };
        setBlocks((prev) => [...prev, newBlock]);
        setSelectedBlockId(newBlock.id);
      }

      dragSourceRef.current = null;
    },
    []
  );

  /* ---- Block operations ---- */
  const updateBlock = useCallback((updated: BlockData) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }, []);

  const deleteBlock = useCallback(
    (id: string) => {
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      if (selectedBlockId === id) setSelectedBlockId(null);
    },
    [selectedBlockId]
  );

  const moveBlock = useCallback((id: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, []);

  /* ---- Save ---- */
  const handleSave = useCallback(() => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSavedAt(new Date().toLocaleTimeString());
    }, 800);
  }, []);

  /* ---- Preview ---- */
  const handlePreview = useCallback(() => {
    const html = generatePreviewHtml(blocks, pageName);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [blocks, pageName]);

  /* ---- AI Generate ---- */
  const handleAiGenerate = useCallback(() => {
    const matchingTemplate = TEMPLATES.find((t) =>
      blocks.length > 0
        ? blocks.some((b) => {
            const tplBlocks = t.blocks.map((tb) => tb.type);
            return tplBlocks.includes(b.type);
          })
        : false
    );
    const templateName = matchingTemplate?.name || 'SaaS Landing';
    const aiData = AI_CONTENT[templateName] || AI_CONTENT['SaaS Landing'];

    setBlocks((prev) =>
      prev.map((block) => {
        const aiBlock = aiData?.[block.type];
        if (!aiBlock) return block;
        return { ...block, ...aiBlock, id: block.id, type: block.type };
      })
    );
  }, [blocks]);

  /* ---- Apply theme ---- */
  const applyTheme = useCallback((theme: ColorTheme) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.type === 'hero' || block.type === 'cta' || block.type === 'stats') {
          return { ...block, bgColor: theme.primary, textColor: '#ffffff' };
        }
        return { ...block, bgColor: theme.bg, textColor: theme.text };
      })
    );
  }, []);

  /* ---- Template select ---- */
  const handleTemplateSelect = useCallback((newBlocks: BlockData[]) => {
    setBlocks(newBlocks);
    setSelectedBlockId(null);
  }, []);

  /* ---- Canvas width ---- */
  const canvasWidth = viewMode === 'desktop' ? 'max-w-full' : viewMode === 'tablet' ? 'max-w-[768px]' : 'max-w-[375px]';

  return (
    <div className="h-screen flex flex-col bg-[#0f0f23] text-gray-200 overflow-hidden">
      {/* ======== TOP BAR ======== */}
      <div className="h-14 border-b border-gray-700/50 bg-[#12122b] flex items-center px-4 gap-3 shrink-0">
        <button
          onClick={() => window.history.back()}
          className="text-gray-400 hover:text-white transition-colors mr-1"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <input
          value={pageName}
          onChange={(e) => setPageName(e.target.value)}
          className="bg-transparent text-white font-semibold text-sm outline-none border-b border-transparent hover:border-gray-600 focus:border-indigo-500 transition-colors px-1 py-0.5 w-48"
        />

        <div className="flex items-center gap-1 ml-2 text-gray-500 text-xs">
          <Globe className="w-3 h-3" />
          <span>/</span>
          <input
            value={urlSlug}
            onChange={(e) => setUrlSlug(e.target.value.replace(/[^a-z0-9-]/g, ''))}
            className="bg-transparent text-gray-300 text-xs outline-none border-b border-transparent hover:border-gray-600 focus:border-indigo-500 transition-colors w-36 font-mono"
            placeholder="url-slug"
          />
        </div>

        <div className="flex-1" />

        {/* Responsive toggles */}
        <div className="flex items-center gap-0.5 bg-[#0f0f23] rounded-lg p-0.5">
          {([
            { mode: 'desktop' as ViewMode, Icon: Monitor },
            { mode: 'tablet' as ViewMode, Icon: Tablet },
            { mode: 'mobile' as ViewMode, Icon: Smartphone },
          ]).map(({ mode, Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === mode ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-700/50 mx-1" />

        {/* Theme selector */}
        <div className="relative">
          <button
            onClick={() => setShowThemes(!showThemes)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-muted"
          >
            <Palette className="w-4 h-4" />
            <span className="hidden lg:inline">Theme</span>
          </button>
          {showThemes && (
            <div className="absolute top-full right-0 mt-2 bg-[#1a1a2e] border border-gray-700/50 rounded-xl p-3 z-50 w-48 shadow-xl">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Color Themes</p>
              {COLOR_THEMES.map((theme, i) => (
                <button
                  key={theme.name}
                  onClick={() => {
                    setActiveTheme(i);
                    applyTheme(theme);
                    setShowThemes(false);
                  }}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-xs transition-colors ${
                    activeTheme === i ? 'bg-indigo-500/10 text-indigo-300' : 'text-gray-400 hover:bg-muted hover:text-white'
                  }`}
                >
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ background: theme.primary }} />
                    <div className="w-4 h-4 rounded-full" style={{ background: theme.bg, border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  {theme.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Generate */}
        <button
          onClick={handleAiGenerate}
          disabled={blocks.length === 0}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/80/15 text-primary hover:bg-primary/80/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generate Content
        </button>

        {/* Templates */}
        <button
          onClick={() => setShowTemplates(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-muted transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          Templates
        </button>

        <div className="w-px h-6 bg-gray-700/50 mx-1" />

        {/* Publish toggle */}
        <button
          onClick={() => setPublished(!published)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
            published ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-gray-500'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${published ? 'bg-emerald-400' : 'bg-gray-600'}`} />
          {published ? 'Published' : 'Draft'}
        </button>

        {/* Preview */}
        <button
          onClick={handlePreview}
          disabled={blocks.length === 0}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden lg:inline">Preview</span>
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors font-medium"
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        {savedAt && <span className="text-[10px] text-gray-500 ml-1">{savedAt}</span>}
      </div>

      {/* ======== BODY ======== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ---- LEFT SIDEBAR: Block Library ---- */}
        <div
          className={`border-r border-gray-700/50 bg-[#12122b] flex flex-col shrink-0 transition-all duration-200 ${
            sidebarCollapsed ? 'w-12' : 'w-56'
          }`}
        >
          <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
            {!sidebarCollapsed && <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Blocks</span>}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-gray-500 hover:text-white transition-colors ml-auto"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {BLOCK_LIBRARY.map(({ type, label, icon: Icon }) => (
              <div
                key={type}
                draggable
                onDragStart={(e) => handleLibraryDragStart(e, type)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-grab active:cursor-grabbing text-gray-400 hover:text-white hover:bg-indigo-500/10 transition-colors group ${
                  sidebarCollapsed ? 'justify-center px-0' : ''
                }`}
                title={label}
              >
                <Icon className="w-4 h-4 text-indigo-400/60 group-hover:text-indigo-400 shrink-0" />
                {!sidebarCollapsed && <span className="text-xs font-medium">{label}</span>}
                {!sidebarCollapsed && <GripVertical className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-40" />}
              </div>
            ))}
          </div>
        </div>

        {/* ---- CENTER: Canvas ---- */}
        <div className="flex-1 overflow-y-auto bg-[#0a0a1a] p-6">
          <div
            ref={canvasRef}
            className={`mx-auto ${canvasWidth} transition-all duration-300`}
            onDragOver={(e) => {
              e.preventDefault();
              if (blocks.length === 0) e.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={handleCanvasRootDrop}
          >
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5">
                  <Layout className="w-10 h-10 text-indigo-400/40" />
                </div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Start Building</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm">
                  Drag blocks from the sidebar to start building your landing page, or choose a template to get started quickly.
                </p>
                <button
                  onClick={() => setShowTemplates(true)}
                  className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  Browse Templates
                </button>
              </div>
            ) : (
              <div className="space-y-0">
                {blocks.map((block, index) => {
                  const Preview = BLOCK_PREVIEWS[block.type];
                  const isSelected = selectedBlockId === block.id;

                  return (
                    <div key={block.id}>
                      {/* Drop zone above */}
                      <div
                        onDragOver={(e) => handleCanvasDragOver(e, index)}
                        onDragLeave={() => setDragOverIndex(null)}
                        onDrop={(e) => handleCanvasDrop(e, index)}
                        className={`h-2 transition-all ${
                          dragOverIndex === index ? 'h-8 bg-indigo-500/20 border-2 border-dashed border-indigo-500/40 rounded-lg my-1' : ''
                        }`}
                      />

                      {/* Block */}
                      <div
                        draggable
                        onDragStart={(e) => handleCanvasDragStart(e, block.id)}
                        onClick={() => setSelectedBlockId(isSelected ? null : block.id)}
                        className={`relative group rounded-lg overflow-hidden cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0a0a1a]'
                            : 'hover:ring-1 hover:ring-gray-600 hover:ring-offset-1 hover:ring-offset-[#0a0a1a]'
                        }`}
                      >
                        {/* Block toolbar overlay */}
                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-background text-gray-300 capitalize backdrop-blur-sm mr-1">
                            {block.type}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveBlock(block.id, -1); }}
                            disabled={index === 0}
                            className="p-1 rounded bg-background text-gray-300 hover:text-white backdrop-blur-sm disabled:opacity-30"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 1); }}
                            disabled={index === blocks.length - 1}
                            className="p-1 rounded bg-background text-gray-300 hover:text-white backdrop-blur-sm disabled:opacity-30"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBlock(block.id);
                            }}
                            className="p-1 rounded bg-background text-red-400 hover:text-red-300 hover:bg-red-500/20 backdrop-blur-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Drag handle */}
                        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                          <div className="p-1 rounded bg-background backdrop-blur-sm">
                            <GripVertical className="w-3 h-3 text-gray-400" />
                          </div>
                        </div>

                        <Preview block={block} />
                      </div>
                    </div>
                  );
                })}

                {/* Final drop zone */}
                <div
                  onDragOver={(e) => handleCanvasDragOver(e, blocks.length)}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={(e) => handleCanvasDrop(e, blocks.length)}
                  className={`h-2 transition-all ${
                    dragOverIndex === blocks.length
                      ? 'h-8 bg-indigo-500/20 border-2 border-dashed border-indigo-500/40 rounded-lg my-1'
                      : ''
                  }`}
                />

                {/* Add block hint */}
                <div className="flex justify-center py-8">
                  <p className="text-xs text-gray-600">Drag more blocks here to continue building</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---- RIGHT PANEL: Block Editor ---- */}
        {selectedBlock && (
          <BlockEditorPanel
            block={selectedBlock}
            onUpdate={updateBlock}
            onClose={() => setSelectedBlockId(null)}
          />
        )}
      </div>

      {/* ======== MODALS ======== */}
      {showTemplates && (
        <TemplateGallery
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Preview HTML Generator                                             */
/* ------------------------------------------------------------------ */

function generatePreviewHtml(blocks: BlockData[], title: string): string {
  const sections = blocks
    .map((block) => {
      const style = `background:${block.bgColor};color:${block.textColor};`;
      switch (block.type) {
        case 'hero':
          return `<section style="${style}padding:80px 32px;text-align:center">
            <h1 style="font-size:48px;font-weight:bold;margin-bottom:12px">${block.heading}</h1>
            <p style="font-size:20px;opacity:0.8;margin-bottom:16px">${block.subheading}</p>
            <p style="max-width:560px;margin:0 auto 32px;opacity:0.6">${block.body}</p>
            ${block.buttonText ? `<a href="${block.buttonUrl}" style="display:inline-block;padding:14px 32px;border-radius:8px;background:rgba(255,255,255,0.2);color:inherit;text-decoration:none;font-weight:600;border:1px solid rgba(255,255,255,0.3)">${block.buttonText}</a>` : ''}
          </section>`;
        case 'features':
          return `<section style="${style}padding:64px 32px">
            <h2 style="font-size:32px;font-weight:bold;text-align:center;margin-bottom:8px">${block.heading}</h2>
            <p style="text-align:center;opacity:0.7;margin-bottom:48px">${block.subheading}</p>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto">
              ${block.items.map((item) => `<div style="text-align:center;padding:16px"><h3 style="font-weight:600;margin-bottom:4px">${item.title}</h3><p style="font-size:14px;opacity:0.6">${item.description}</p></div>`).join('')}
            </div>
          </section>`;
        case 'testimonials':
          return `<section style="${style}padding:64px 32px">
            <h2 style="font-size:32px;font-weight:bold;text-align:center;margin-bottom:48px">${block.heading}</h2>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto">
              ${block.items.map((item) => `<div style="padding:24px;border-radius:12px;background:rgba(0,0,0,0.04)"><p style="font-style:italic;opacity:0.8;margin-bottom:12px">${item.description}</p><p style="font-size:13px;font-weight:600">${item.title}</p></div>`).join('')}
            </div>
          </section>`;
        case 'pricing':
          return `<section style="${style}padding:64px 32px">
            <h2 style="font-size:32px;font-weight:bold;text-align:center;margin-bottom:8px">${block.heading}</h2>
            <p style="text-align:center;opacity:0.7;margin-bottom:48px">${block.subheading}</p>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto">
              ${block.items.map((item) => `<div style="padding:32px;border-radius:12px;text-align:center;border:1px solid rgba(0,0,0,0.1)"><h3 style="font-size:20px;font-weight:bold;margin-bottom:8px">${item.title}</h3><p style="font-size:14px;opacity:0.6;margin-bottom:24px">${item.description}</p>${block.buttonText ? `<a href="${block.buttonUrl}" style="display:inline-block;padding:10px 24px;border-radius:8px;background:#f59e0b;color:#fff;text-decoration:none;font-weight:600;font-size:14px">${block.buttonText}</a>` : ''}</div>`).join('')}
            </div>
          </section>`;
        case 'cta':
          return `<section style="${style}padding:64px 32px;text-align:center">
            <h2 style="font-size:36px;font-weight:bold;margin-bottom:12px">${block.heading}</h2>
            <p style="opacity:0.8;margin-bottom:8px">${block.subheading}</p>
            <p style="font-size:14px;opacity:0.6;margin-bottom:32px">${block.body}</p>
            ${block.buttonText ? `<a href="${block.buttonUrl}" style="display:inline-block;padding:14px 32px;border-radius:8px;background:rgba(255,255,255,0.2);color:inherit;text-decoration:none;font-weight:600;border:1px solid rgba(255,255,255,0.3)">${block.buttonText}</a>` : ''}
          </section>`;
        case 'faq':
          return `<section style="${style}padding:64px 32px">
            <h2 style="font-size:32px;font-weight:bold;text-align:center;margin-bottom:48px">${block.heading}</h2>
            <div style="max-width:640px;margin:0 auto">
              ${block.items.map((item) => `<div style="padding:16px;border-radius:8px;background:rgba(0,0,0,0.04);margin-bottom:12px"><h3 style="font-weight:600;font-size:15px;margin-bottom:4px">${item.title}</h3><p style="font-size:14px;opacity:0.6">${item.description}</p></div>`).join('')}
            </div>
          </section>`;
        case 'stats':
          return `<section style="${style}padding:64px 32px">
            <h2 style="font-size:32px;font-weight:bold;text-align:center;margin-bottom:48px">${block.heading}</h2>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;max-width:900px;margin:0 auto;text-align:center">
              ${block.items.map((item) => `<div><p style="font-size:36px;font-weight:bold;margin-bottom:4px">${item.title}</p><p style="font-size:13px;opacity:0.6">${item.description}</p></div>`).join('')}
            </div>
          </section>`;
        case 'team':
          return `<section style="${style}padding:64px 32px">
            <h2 style="font-size:32px;font-weight:bold;text-align:center;margin-bottom:8px">${block.heading}</h2>
            <p style="text-align:center;opacity:0.7;margin-bottom:48px">${block.subheading}</p>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto;text-align:center">
              ${block.items.map((item) => `<div><div style="width:64px;height:64px;border-radius:50%;background:rgba(99,102,241,0.15);margin:0 auto 12px"></div><p style="font-weight:600">${item.title}</p><p style="font-size:13px;opacity:0.6">${item.description}</p></div>`).join('')}
            </div>
          </section>`;
        case 'contact':
          return `<section style="${style}padding:64px 32px;text-align:center">
            <h2 style="font-size:32px;font-weight:bold;margin-bottom:8px">${block.heading}</h2>
            <p style="opacity:0.7;margin-bottom:32px">${block.subheading}</p>
            <p style="white-space:pre-line;opacity:0.6;max-width:400px;margin:0 auto 24px">${block.body}</p>
            ${block.buttonText ? `<a href="${block.buttonUrl}" style="display:inline-block;padding:14px 32px;border-radius:8px;background:#f59e0b;color:#fff;text-decoration:none;font-weight:600">${block.buttonText}</a>` : ''}
          </section>`;
        case 'form':
          return `<section style="${style}padding:64px 32px">
            <h2 style="font-size:32px;font-weight:bold;text-align:center;margin-bottom:8px">${block.heading}</h2>
            <p style="text-align:center;opacity:0.7;margin-bottom:32px">${block.subheading}</p>
            <form style="max-width:480px;margin:0 auto">
              ${block.items.map((item) => `<div style="margin-bottom:16px"><label style="display:block;font-size:13px;font-weight:500;margin-bottom:4px;opacity:0.7">${item.title}</label>${item.description === 'textarea' ? `<textarea style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.15);min-height:80px;box-sizing:border-box"></textarea>` : `<input type="${item.description || 'text'}" style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,0.15);box-sizing:border-box" />`}</div>`).join('')}
              ${block.buttonText ? `<button type="submit" style="width:100%;padding:14px;border-radius:8px;background:#f59e0b;color:#fff;border:none;font-weight:600;cursor:pointer;font-size:15px">${block.buttonText}</button>` : ''}
            </form>
          </section>`;
        case 'video':
          return `<section style="${style}padding:64px 32px;text-align:center">
            <h2 style="font-size:32px;font-weight:bold;margin-bottom:8px">${block.heading}</h2>
            <p style="opacity:0.7;margin-bottom:32px">${block.subheading}</p>
            <div style="max-width:720px;margin:0 auto;aspect-ratio:16/9;border-radius:12px;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.4"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
          </section>`;
        case 'gallery':
          return `<section style="${style}padding:64px 32px">
            <h2 style="font-size:32px;font-weight:bold;text-align:center;margin-bottom:8px">${block.heading}</h2>
            <p style="text-align:center;opacity:0.7;margin-bottom:48px">${block.subheading}</p>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:900px;margin:0 auto">
              ${block.items.map((item) => `<div style="aspect-ratio:1;border-radius:12px;background:rgba(0,0,0,0.06);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px"><p style="font-size:13px;font-weight:500">${item.title}</p></div>`).join('')}
            </div>
          </section>`;
        default:
          return '';
      }
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6}</style>
</head>
<body>${sections}</body>
</html>`;
}
