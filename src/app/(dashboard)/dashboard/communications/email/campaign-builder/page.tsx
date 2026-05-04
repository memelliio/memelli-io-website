'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Mail,
  Layout,
  Type,
  Image,
  MousePointerClick,
  Minus,
  Share2,
  AlignLeft,
  Monitor,
  Smartphone,
  Sparkles,
  Users,
  Tag,
  List,
  UserPlus,
  Clock,
  Send,
  FlaskConical,
  BarChart3,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Eye,
  Copy,
  Plus,
  ArrowLeft,
  CalendarDays,
  Trophy,
  Megaphone,
  Newspaper,
  Bell,
  RotateCcw,
  Heart,
  Check,
  X,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type BlockType = 'header' | 'text' | 'image' | 'button' | 'divider' | 'social' | 'footer';

interface EmailBlock {
  id: string;
  type: BlockType;
  content: Record<string, string>;
}

type RecipientMode = 'all' | 'segment' | 'tag' | 'manual';
type ScheduleMode = 'now' | 'scheduled';
type PreviewMode = 'desktop' | 'mobile';
type BuilderTab = 'templates' | 'editor' | 'settings' | 'review';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  blocks: EmailBlock[];
}

interface CampaignHistory {
  id: string;
  name: string;
  sentAt: string;
  recipients: number;
  openRate: number;
  clickRate: number;
  status: 'sent' | 'scheduled' | 'draft';
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: 'header', label: 'Header', icon: <Layout className="h-4 w-4" /> },
  { type: 'text', label: 'Text Block', icon: <Type className="h-4 w-4" /> },
  { type: 'image', label: 'Image', icon: <Image className="h-4 w-4" /> },
  { type: 'button', label: 'Button', icon: <MousePointerClick className="h-4 w-4" /> },
  { type: 'divider', label: 'Divider', icon: <Minus className="h-4 w-4" /> },
  { type: 'social', label: 'Social Links', icon: <Share2 className="h-4 w-4" /> },
  { type: 'footer', label: 'Footer', icon: <AlignLeft className="h-4 w-4" /> },
];

const uid = () => Math.random().toString(36).slice(2, 10);

function makeDefaultContent(type: BlockType): Record<string, string> {
  switch (type) {
    case 'header':
      return { title: 'Your Headline Here', subtitle: 'Supporting text goes here' };
    case 'text':
      return { body: 'Write your email content here. Keep it concise and engaging for your readers.' };
    case 'image':
      return { url: '', alt: 'Image description', caption: '' };
    case 'button':
      return { label: 'Click Here', url: 'https://', color: '#dc2626' };
    case 'divider':
      return { style: 'solid' };
    case 'social':
      return { facebook: '', twitter: '', instagram: '', linkedin: '' };
    case 'footer':
      return { text: 'You are receiving this because you subscribed. Unsubscribe anytime.', company: 'Memelli Universe' };
    default:
      return {};
  }
}

const TEMPLATES: Template[] = [
  {
    id: 'welcome',
    name: 'Welcome',
    description: 'Greet new subscribers with a warm introduction',
    icon: <Heart className="h-5 w-5" />,
    blocks: [
      { id: uid(), type: 'header', content: { title: 'Welcome to the Family!', subtitle: 'We are thrilled to have you on board' } },
      { id: uid(), type: 'text', content: { body: 'Thank you for joining us! We are excited to help you get started. Here is what you can expect from us...' } },
      { id: uid(), type: 'button', content: { label: 'Get Started', url: 'https://', color: '#dc2626' } },
      { id: uid(), type: 'divider', content: { style: 'solid' } },
      { id: uid(), type: 'footer', content: { text: 'You are receiving this because you recently signed up.', company: 'Memelli Universe' } },
    ],
  },
  {
    id: 'promotional',
    name: 'Promotional',
    description: 'Drive sales with a compelling offer',
    icon: <Megaphone className="h-5 w-5" />,
    blocks: [
      { id: uid(), type: 'header', content: { title: 'Limited Time Offer', subtitle: 'Don\'t miss out on this exclusive deal' } },
      { id: uid(), type: 'image', content: { url: '', alt: 'Promotional banner', caption: '' } },
      { id: uid(), type: 'text', content: { body: 'For a limited time, enjoy exclusive access to our best products at unbeatable prices. Act fast before it\'s gone!' } },
      { id: uid(), type: 'button', content: { label: 'Shop Now', url: 'https://', color: '#dc2626' } },
      { id: uid(), type: 'footer', content: { text: 'Unsubscribe from promotional emails anytime.', company: 'Memelli Universe' } },
    ],
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Regular updates and curated content',
    icon: <Newspaper className="h-5 w-5" />,
    blocks: [
      { id: uid(), type: 'header', content: { title: 'This Week at Memelli', subtitle: 'Your weekly digest of news and updates' } },
      { id: uid(), type: 'text', content: { body: 'Here is what happened this week. From product updates to community highlights, stay in the loop.' } },
      { id: uid(), type: 'divider', content: { style: 'solid' } },
      { id: uid(), type: 'text', content: { body: 'Featured article: How to maximize your results with our latest tools and integrations.' } },
      { id: uid(), type: 'button', content: { label: 'Read More', url: 'https://', color: '#dc2626' } },
      { id: uid(), type: 'social', content: { facebook: '#', twitter: '#', instagram: '#', linkedin: '#' } },
      { id: uid(), type: 'footer', content: { text: 'You subscribed to our newsletter.', company: 'Memelli Universe' } },
    ],
  },
  {
    id: 'announcement',
    name: 'Announcement',
    description: 'Share important news and product launches',
    icon: <Bell className="h-5 w-5" />,
    blocks: [
      { id: uid(), type: 'header', content: { title: 'Big News!', subtitle: 'We have something exciting to share' } },
      { id: uid(), type: 'text', content: { body: 'We are thrilled to announce a major update to our platform. This changes everything.' } },
      { id: uid(), type: 'image', content: { url: '', alt: 'Announcement visual', caption: '' } },
      { id: uid(), type: 'button', content: { label: 'Learn More', url: 'https://', color: '#dc2626' } },
      { id: uid(), type: 'footer', content: { text: 'Stay updated with our latest announcements.', company: 'Memelli Universe' } },
    ],
  },
  {
    id: 'followup',
    name: 'Follow-up',
    description: 'Re-engage after a meeting or interaction',
    icon: <RotateCcw className="h-5 w-5" />,
    blocks: [
      { id: uid(), type: 'header', content: { title: 'Following Up', subtitle: 'Thanks for your time' } },
      { id: uid(), type: 'text', content: { body: 'It was great connecting with you. As discussed, here are the next steps and resources we mentioned.' } },
      { id: uid(), type: 'button', content: { label: 'Schedule a Call', url: 'https://', color: '#dc2626' } },
      { id: uid(), type: 'footer', content: { text: 'This is a follow-up from our recent conversation.', company: 'Memelli Universe' } },
    ],
  },
  {
    id: 'reengagement',
    name: 'Re-engagement',
    description: 'Win back inactive contacts',
    icon: <Trophy className="h-5 w-5" />,
    blocks: [
      { id: uid(), type: 'header', content: { title: 'We Miss You!', subtitle: 'It has been a while since your last visit' } },
      { id: uid(), type: 'text', content: { body: 'A lot has changed since you were last here. Come see what\'s new and pick up where you left off.' } },
      { id: uid(), type: 'button', content: { label: 'Come Back', url: 'https://', color: '#dc2626' } },
      { id: uid(), type: 'divider', content: { style: 'solid' } },
      { id: uid(), type: 'text', content: { body: 'Not interested anymore? No hard feelings. Click below to update your preferences.' } },
      { id: uid(), type: 'footer', content: { text: 'You can unsubscribe at any time.', company: 'Memelli Universe' } },
    ],
  },
];

const MOCK_HISTORY: CampaignHistory[] = [
  { id: '1', name: 'March Newsletter', sentAt: '2026-03-10T14:00:00Z', recipients: 2340, openRate: 34.2, clickRate: 8.1, status: 'sent' },
  { id: '2', name: 'Spring Sale Promo', sentAt: '2026-03-08T10:00:00Z', recipients: 4120, openRate: 41.7, clickRate: 12.3, status: 'sent' },
  { id: '3', name: 'Product Launch', sentAt: '2026-03-05T09:00:00Z', recipients: 3800, openRate: 38.5, clickRate: 15.6, status: 'sent' },
  { id: '4', name: 'Welcome Series #1', sentAt: '2026-03-20T08:00:00Z', recipients: 500, openRate: 0, clickRate: 0, status: 'scheduled' },
  { id: '5', name: 'Re-engagement Flow', sentAt: '', recipients: 1200, openRate: 0, clickRate: 0, status: 'draft' },
];

const AI_SUBJECT_SUGGESTIONS = [
  'Don\'t miss this: exclusive inside access',
  'Your next step starts here',
  'We built something just for you',
  'Quick question about your goals',
  'This changes everything (no, really)',
];

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function BlockEditor({
  block,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  block: EmailBlock;
  onChange: (id: string, content: Record<string, string>) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = BLOCK_TYPES.find((b) => b.type === block.type);

  return (
    <div className="group bg-muted border border-white/[0.06] rounded-xl overflow-hidden transition-all duration-200 hover:border-red-500/20">
      {/* Block header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-white/[0.04]">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        <span className="text-muted-foreground">{meta?.icon}</span>
        <span className="text-xs font-medium text-foreground uppercase tracking-wider">{meta?.label}</span>
        <div className="flex-1" />
        <button onClick={() => onMoveUp(block.id)} disabled={isFirst} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onMoveDown(block.id)} disabled={isLast} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <Eye className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
        </button>
        <button onClick={() => onRemove(block.id)} className="p-1 text-muted-foreground hover:text-red-400 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Block content */}
      {!collapsed && (
        <div className="p-4 space-y-3">
          {block.type === 'header' && (
            <>
              <input
                value={block.content.title}
                onChange={(e) => onChange(block.id, { ...block.content, title: e.target.value })}
                placeholder="Headline"
                className="w-full bg-card border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20"
              />
              <input
                value={block.content.subtitle}
                onChange={(e) => onChange(block.id, { ...block.content, subtitle: e.target.value })}
                placeholder="Subtitle"
                className="w-full bg-card border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20"
              />
            </>
          )}
          {block.type === 'text' && (
            <textarea
              value={block.content.body}
              onChange={(e) => onChange(block.id, { ...block.content, body: e.target.value })}
              placeholder="Write your content..."
              rows={4}
              className="w-full bg-card border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 resize-none"
            />
          )}
          {block.type === 'image' && (
            <>
              <input
                value={block.content.url}
                onChange={(e) => onChange(block.id, { ...block.content, url: e.target.value })}
                placeholder="Image URL"
                className="w-full bg-card border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20"
              />
              <input
                value={block.content.alt}
                onChange={(e) => onChange(block.id, { ...block.content, alt: e.target.value })}
                placeholder="Alt text"
                className="w-full bg-card border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20"
              />
            </>
          )}
          {block.type === 'button' && (
            <div className="grid grid-cols-2 gap-3">
              <input
                value={block.content.label}
                onChange={(e) => onChange(block.id, { ...block.content, label: e.target.value })}
                placeholder="Button label"
                className="bg-card border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20"
              />
              <input
                value={block.content.url}
                onChange={(e) => onChange(block.id, { ...block.content, url: e.target.value })}
                placeholder="Button URL"
                className="bg-card border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20"
              />
            </div>
          )}
          {block.type === 'divider' && (
            <div className="border-t border-white/[0.08] my-2" />
          )}
          {block.type === 'social' && (
            <div className="grid grid-cols-2 gap-3">
              {['facebook', 'twitter', 'instagram', 'linkedin'].map((platform) => (
                <input
                  key={platform}
                  value={block.content[platform]}
                  onChange={(e) => onChange(block.id, { ...block.content, [platform]: e.target.value })}
                  placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`}
                  className="bg-card border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                />
              ))}
            </div>
          )}
          {block.type === 'footer' && (
            <>
              <input
                value={block.content.company}
                onChange={(e) => onChange(block.id, { ...block.content, company: e.target.value })}
                placeholder="Company name"
                className="w-full bg-card border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20"
              />
              <textarea
                value={block.content.text}
                onChange={(e) => onChange(block.id, { ...block.content, text: e.target.value })}
                placeholder="Footer text..."
                rows={2}
                className="w-full bg-card border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20 resize-none"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EmailPreview({ blocks, previewMode, subject }: { blocks: EmailBlock[]; previewMode: PreviewMode; subject: string }) {
  const width = previewMode === 'desktop' ? 'max-w-[600px]' : 'max-w-[375px]';

  return (
    <div className={`${width} mx-auto bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300`}>
      {/* Email header bar */}
      <div className="bg-muted px-4 py-3 border-b border-border">
        <p className="text-xs text-muted-foreground">Subject</p>
        <p className="text-sm font-medium text-muted-foreground truncate">{subject || 'No subject'}</p>
      </div>

      {/* Email body */}
      <div className="p-0">
        {blocks.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">Add blocks to see your email preview</div>
        )}
        {blocks.map((block) => (
          <div key={block.id}>
            {block.type === 'header' && (
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-8 text-center">
                <h1 className="text-xl font-bold text-white mb-1">{block.content.title}</h1>
                {block.content.subtitle && <p className="text-red-100 text-sm">{block.content.subtitle}</p>}
              </div>
            )}
            {block.type === 'text' && (
              <div className="px-6 py-4">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{block.content.body}</p>
              </div>
            )}
            {block.type === 'image' && (
              <div className="px-6 py-3">
                {block.content.url ? (
                  <img src={block.content.url} alt={block.content.alt} className="w-full rounded-lg" />
                ) : (
                  <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center">
                    <Image className="h-8 w-8 text-foreground" />
                  </div>
                )}
              </div>
            )}
            {block.type === 'button' && (
              <div className="px-6 py-4 text-center">
                <span
                  className="inline-block px-6 py-2.5 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: block.content.color || '#dc2626' }}
                >
                  {block.content.label}
                </span>
              </div>
            )}
            {block.type === 'divider' && (
              <div className="px-6 py-2">
                <hr className="border-border" />
              </div>
            )}
            {block.type === 'social' && (
              <div className="px-6 py-4 text-center space-x-4">
                {['facebook', 'twitter', 'instagram', 'linkedin'].map((p) => (
                  block.content[p] ? (
                    <span key={p} className="inline-block text-xs text-blue-600 underline cursor-pointer">
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </span>
                  ) : null
                ))}
                {!Object.values(block.content).some(Boolean) && (
                  <span className="text-xs text-muted-foreground">Social links will appear here</span>
                )}
              </div>
            )}
            {block.type === 'footer' && (
              <div className="bg-muted px-6 py-4 text-center border-t border-border">
                <p className="text-[11px] text-muted-foreground mb-1">{block.content.company}</p>
                <p className="text-[10px] text-muted-foreground">{block.content.text}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function CampaignBuilderPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<BuilderTab>('templates');

  // Campaign data
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectB, setSubjectB] = useState('');
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');

  // Recipients
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('all');
  const [segmentValue, setSegmentValue] = useState('');
  const [tagValue, setTagValue] = useState('');
  const [manualEmails, setManualEmails] = useState('');

  // Scheduling
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // A/B Test
  const [abTestEnabled, setAbTestEnabled] = useState(false);

  // AI suggestions
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Test email
  const [testSending, setTestSending] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // ─── Handlers ───

  const handleSelectTemplate = useCallback((template: Template) => {
    setBlocks(template.blocks.map((b) => ({ ...b, id: uid() })));
    setCampaignName(template.name + ' Campaign');
    setActiveTab('editor');
  }, []);

  const handleAddBlock = useCallback((type: BlockType) => {
    setBlocks((prev) => [...prev, { id: uid(), type, content: makeDefaultContent(type) }]);
  }, []);

  const handleUpdateBlock = useCallback((id: string, content: Record<string, string>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content } : b)));
  }, []);

  const handleRemoveBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleMoveUp = useCallback((id: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((id: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const handleAiSuggest = useCallback(() => {
    setAiLoading(true);
    setShowAiSuggestions(false);
    setTimeout(() => {
      setAiLoading(false);
      setShowAiSuggestions(true);
    }, 1200);
  }, []);

  const handleSendTest = useCallback(() => {
    setTestSending(true);
    setTestSent(false);
    setTimeout(() => {
      setTestSending(false);
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }, 1500);
  }, []);

  // ─── Computed ───

  const estimatedReach = recipientMode === 'all' ? 4850 : recipientMode === 'segment' ? 1240 : recipientMode === 'tag' ? 890 : manualEmails.split(/[,\n]/).filter(Boolean).length;
  const predictedOpenRate = recipientMode === 'all' ? 32.4 : recipientMode === 'segment' ? 41.2 : recipientMode === 'tag' ? 38.7 : 45.1;

  const tabs: { key: BuilderTab; label: string; icon: React.ReactNode }[] = [
    { key: 'templates', label: 'Templates', icon: <Layout className="h-4 w-4" /> },
    { key: 'editor', label: 'Editor', icon: <Type className="h-4 w-4" /> },
    { key: 'settings', label: 'Settings', icon: <Users className="h-4 w-4" /> },
    { key: 'review', label: 'Review', icon: <Eye className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-card px-6 py-8">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-8">
        <div className="flex items-center gap-3 mb-6">
          <a href="/dashboard/communications/email" className="p-2 rounded-lg bg-card border border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-red-500/30 transition-all duration-200">
            <ArrowLeft className="h-4 w-4" />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Email Campaign Builder</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Design, configure, and launch email campaigns</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-card border border-white/[0.04] rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        {/* ════════════════════════════════════════ TEMPLATES TAB ════════════════════════════════════════ */}
        {activeTab === 'templates' && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Choose a Template</h2>
            <p className="text-sm text-muted-foreground mb-6">Select a starting template or start from scratch</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="group text-left bg-card border border-white/[0.06] rounded-xl p-5 hover:border-red-500/40 hover:bg-card transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-red-600/10 text-red-500 group-hover:bg-red-600/20 transition-colors">
                      {template.icon}
                    </div>
                    <h3 className="font-semibold text-foreground group-hover:text-white transition-colors">{template.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{template.description}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Layout className="h-3 w-3" />
                    <span>{template.blocks.length} blocks</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Start from scratch */}
            <button
              onClick={() => { setBlocks([]); setCampaignName('New Campaign'); setActiveTab('editor'); }}
              className="w-full bg-card border border-dashed border-white/[0.08] rounded-xl p-6 text-center hover:border-red-500/30 hover:bg-card transition-all duration-200 group"
            >
              <Plus className="h-6 w-6 text-muted-foreground mx-auto mb-2 group-hover:text-red-500 transition-colors" />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Start from scratch</span>
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════ EDITOR TAB ════════════════════════════════════════ */}
        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left: Block editor */}
            <div className="space-y-6">
              {/* Campaign name */}
              <div className="bg-card border border-white/[0.04] rounded-xl p-5">
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Campaign Name</label>
                <input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="My Campaign"
                  className="w-full bg-muted border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                />
              </div>

              {/* Subject line */}
              <div className="bg-card border border-white/[0.04] rounded-xl p-5">
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Subject Line</label>
                <div className="flex gap-2">
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter subject line..."
                    className="flex-1 bg-muted border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                  />
                  <button
                    onClick={handleAiSuggest}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-600/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-all duration-200 text-sm disabled:opacity-50"
                  >
                    <Sparkles className={`h-3.5 w-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                    AI
                  </button>
                </div>

                {/* AI suggestions dropdown */}
                {showAiSuggestions && (
                  <div className="mt-3 bg-muted border border-red-500/20 rounded-lg p-3 space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-red-400 font-medium mb-2">AI Suggestions</p>
                    {AI_SUBJECT_SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { setSubject(s); setShowAiSuggestions(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted hover:text-white transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* A/B test subject */}
                {abTestEnabled && (
                  <div className="mt-3">
                    <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Subject B (A/B Test)</label>
                    <input
                      value={subjectB}
                      onChange={(e) => setSubjectB(e.target.value)}
                      placeholder="Alternative subject line..."
                      className="w-full bg-muted border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">System sends both to 10% each, then sends the winner to the remaining 80%</p>
                  </div>
                )}
              </div>

              {/* Block palette */}
              <div className="bg-card border border-white/[0.04] rounded-xl p-5">
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Add Block</label>
                <div className="flex flex-wrap gap-2">
                  {BLOCK_TYPES.map((bt) => (
                    <button
                      key={bt.type}
                      onClick={() => handleAddBlock(bt.type)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-muted border border-white/[0.06] rounded-lg text-xs text-muted-foreground hover:text-white hover:border-red-500/30 hover:bg-muted transition-all duration-200"
                    >
                      {bt.icon}
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Block list */}
              <div className="space-y-3">
                {blocks.length === 0 && (
                  <div className="bg-card border border-dashed border-white/[0.08] rounded-xl p-8 text-center">
                    <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No blocks yet. Add blocks above or choose a template.</p>
                  </div>
                )}
                {blocks.map((block, idx) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    onChange={handleUpdateBlock}
                    onRemove={handleRemoveBlock}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    isFirst={idx === 0}
                    isLast={idx === blocks.length - 1}
                  />
                ))}
              </div>
            </div>

            {/* Right: Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Preview</h3>
                <div className="flex gap-1 bg-card border border-white/[0.06] rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`p-2 rounded-md transition-all duration-200 ${previewMode === 'desktop' ? 'bg-red-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Monitor className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`p-2 rounded-md transition-all duration-200 ${previewMode === 'mobile' ? 'bg-red-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-card border border-white/[0.04] rounded-xl p-6 min-h-[500px] flex items-start justify-center">
                <EmailPreview blocks={blocks} previewMode={previewMode} subject={subject} />
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ SETTINGS TAB ════════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            {/* Recipients */}
            <div className="bg-card border border-white/[0.04] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-red-500" />
                Recipients
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {([
                  { mode: 'all' as RecipientMode, label: 'All Contacts', icon: <Users className="h-4 w-4" /> },
                  { mode: 'segment' as RecipientMode, label: 'Segment', icon: <List className="h-4 w-4" /> },
                  { mode: 'tag' as RecipientMode, label: 'Tag', icon: <Tag className="h-4 w-4" /> },
                  { mode: 'manual' as RecipientMode, label: 'Manual List', icon: <UserPlus className="h-4 w-4" /> },
                ]).map(({ mode, label, icon }) => (
                  <button
                    key={mode}
                    onClick={() => setRecipientMode(mode)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm transition-all duration-200 ${
                      recipientMode === mode
                        ? 'bg-red-600/10 border-red-500/40 text-red-400'
                        : 'bg-muted border-white/[0.06] text-muted-foreground hover:border-white/[0.12] hover:text-foreground'
                    }`}
                  >
                    {icon}
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>

              {recipientMode === 'segment' && (
                <select
                  value={segmentValue}
                  onChange={(e) => setSegmentValue(e.target.value)}
                  className="w-full bg-muted border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none"
                >
                  <option value="">Select segment...</option>
                  <option value="active">Active Users</option>
                  <option value="new">New Subscribers (30 days)</option>
                  <option value="high-value">High-Value Customers</option>
                  <option value="inactive">Inactive (90+ days)</option>
                </select>
              )}

              {recipientMode === 'tag' && (
                <select
                  value={tagValue}
                  onChange={(e) => setTagValue(e.target.value)}
                  className="w-full bg-muted border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none"
                >
                  <option value="">Select tag...</option>
                  <option value="vip">VIP</option>
                  <option value="prospect">Prospect</option>
                  <option value="partner">Partner</option>
                  <option value="affiliate">Affiliate</option>
                </select>
              )}

              {recipientMode === 'manual' && (
                <textarea
                  value={manualEmails}
                  onChange={(e) => setManualEmails(e.target.value)}
                  placeholder="Enter email addresses, one per line or comma-separated..."
                  rows={4}
                  className="w-full bg-muted border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none resize-none"
                />
              )}
            </div>

            {/* Schedule */}
            <div className="bg-card border border-white/[0.04] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-500" />
                Schedule
              </h3>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setScheduleMode('now')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                    scheduleMode === 'now'
                      ? 'bg-red-600/10 border-red-500/40 text-red-400'
                      : 'bg-muted border-white/[0.06] text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  Send Now
                </button>
                <button
                  onClick={() => setScheduleMode('scheduled')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                    scheduleMode === 'scheduled'
                      ? 'bg-red-600/10 border-red-500/40 text-red-400'
                      : 'bg-muted border-white/[0.06] text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CalendarDays className="h-4 w-4" />
                  Schedule
                </button>
              </div>
              {scheduleMode === 'scheduled' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full bg-muted border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full bg-muted border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground focus:border-red-500/50 focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* A/B Test */}
            <div className="bg-card border border-white/[0.04] rounded-xl p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-red-500" />
                  A/B Testing
                </h3>
                <button
                  onClick={() => setAbTestEnabled(!abTestEnabled)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${abTestEnabled ? 'bg-red-600' : 'bg-muted'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${abTestEnabled ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              {abTestEnabled && (
                <div className="mt-4 bg-muted border border-white/[0.06] rounded-lg p-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Two subject lines will be sent to 10% of recipients each. After 4 hours, the winning subject line
                    (higher open rate) is automatically sent to the remaining 80%.
                  </p>
                  {!subjectB && (
                    <p className="text-xs text-red-400 mt-2">Add Subject B in the Editor tab to enable A/B testing.</p>
                  )}
                </div>
              )}
            </div>

            {/* Campaign Stats Preview */}
            <div className="bg-card border border-white/[0.04] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-red-500" />
                Campaign Stats Preview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted border border-white/[0.06] rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{estimatedReach.toLocaleString()}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Estimated Reach</p>
                </div>
                <div className="bg-muted border border-white/[0.06] rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{predictedOpenRate}%</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Predicted Open Rate</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ REVIEW TAB ════════════════════════════════════════ */}
        {activeTab === 'review' && (
          <div className="max-w-3xl space-y-6">
            {/* Summary */}
            <div className="bg-card border border-white/[0.04] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Campaign Summary</h3>
              <div className="space-y-3">
                {[
                  { label: 'Name', value: campaignName || 'Untitled' },
                  { label: 'Subject', value: subject || 'No subject' },
                  ...(abTestEnabled && subjectB ? [{ label: 'Subject B', value: subjectB }] : []),
                  { label: 'Blocks', value: `${blocks.length} email blocks` },
                  { label: 'Recipients', value: recipientMode === 'all' ? 'All contacts' : recipientMode === 'segment' ? `Segment: ${segmentValue || 'Not selected'}` : recipientMode === 'tag' ? `Tag: ${tagValue || 'Not selected'}` : `${manualEmails.split(/[,\n]/).filter(Boolean).length} manual entries` },
                  { label: 'Schedule', value: scheduleMode === 'now' ? 'Send immediately' : `${scheduleDate} at ${scheduleTime}` },
                  { label: 'A/B Test', value: abTestEnabled ? 'Enabled' : 'Disabled' },
                  { label: 'Est. Reach', value: estimatedReach.toLocaleString() },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{row.label}</span>
                    <span className="text-sm text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-card border border-white/[0.04] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Email Preview</h3>
                <div className="flex gap-1 bg-muted border border-white/[0.06] rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`p-1.5 rounded transition-all ${previewMode === 'desktop' ? 'bg-red-600 text-white' : 'text-muted-foreground'}`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`p-1.5 rounded transition-all ${previewMode === 'mobile' ? 'bg-red-600 text-white' : 'text-muted-foreground'}`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <EmailPreview blocks={blocks} previewMode={previewMode} subject={subject} />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSendTest}
                disabled={testSending}
                className="flex items-center gap-2 px-4 py-2.5 bg-muted border border-white/[0.06] rounded-xl text-sm text-foreground hover:text-white hover:border-red-500/30 transition-all duration-200 disabled:opacity-50"
              >
                {testSent ? (
                  <><Check className="h-4 w-4 text-green-400" /> Test Sent</>
                ) : testSending ? (
                  <><Sparkles className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="h-4 w-4" /> Send Test Email</>
                )}
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-muted border border-white/[0.06] rounded-xl text-sm text-foreground hover:text-white hover:border-white/[0.12] transition-all duration-200">
                <Copy className="h-4 w-4" />
                Duplicate Campaign
              </button>
              <div className="flex-1" />
              <button
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-red-600/20 transition-all duration-200"
              >
                <Send className="h-4 w-4" />
                {scheduleMode === 'now' ? 'Launch Campaign' : 'Schedule Campaign'}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ CAMPAIGN HISTORY ════════════════════════════════════════ */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">Campaign History</h2>
          <div className="bg-card border border-white/[0.04] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Campaign</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Recipients</th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Open Rate</th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Click Rate</th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_HISTORY.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-white/[0.04] last:border-0 hover:bg-muted transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-sm text-foreground font-medium">{campaign.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                        campaign.status === 'sent'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : campaign.status === 'scheduled'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {campaign.status === 'sent' && <Check className="h-2.5 w-2.5" />}
                        {campaign.status === 'scheduled' && <Clock className="h-2.5 w-2.5" />}
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm text-muted-foreground">{campaign.recipients.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm text-muted-foreground">{campaign.status === 'sent' ? `${campaign.openRate}%` : '--'}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm text-muted-foreground">{campaign.status === 'sent' ? `${campaign.clickRate}%` : '--'}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm text-muted-foreground">
                        {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--'}
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
  );
}
