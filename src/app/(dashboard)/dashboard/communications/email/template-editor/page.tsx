'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Layout,
  Type,
  Image,
  MousePointerClick,
  Minus,
  AlignLeft,
  Monitor,
  Smartphone,
  Save,
  Send,
  Code,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowLeft,
  Heart,
  Megaphone,
  Newspaper,
  Bell,
  RotateCcw,
  Trophy,
  Variable,
  Copy,
  Check,
  FileText,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type BlockType = 'header' | 'text' | 'image' | 'button' | 'divider' | 'footer';

interface EmailBlock {
  id: string;
  type: BlockType;
  content: Record<string, string>;
}

type PreviewMode = 'desktop' | 'mobile';
type EditorView = 'gallery' | 'editor';

interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  blocks: EmailBlock[];
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
  { type: 'footer', label: 'Footer', icon: <AlignLeft className="h-4 w-4" /> },
];

const VARIABLES = [
  { key: '{{name}}', label: 'Name' },
  { key: '{{company}}', label: 'Company' },
  { key: '{{email}}', label: 'Email' },
  { key: '{{phone}}', label: 'Phone' },
  { key: '{{date}}', label: 'Date' },
  { key: '{{unsubscribe_link}}', label: 'Unsubscribe Link' },
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
    case 'footer':
      return { text: 'You are receiving this because you subscribed. Unsubscribe anytime.', company: 'Memelli Universe' };
    default:
      return {};
  }
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'welcome',
    name: 'Welcome',
    description: 'Greet new subscribers warmly',
    icon: <Heart className="h-5 w-5" />,
    blocks: [
      { id: uid(), type: 'header', content: { title: 'Welcome to {{company}}!', subtitle: 'We are thrilled to have you, {{name}}' } },
      { id: uid(), type: 'text', content: { body: 'Thank you for joining us! We are excited to help you get started. Here is what you can expect...' } },
      { id: uid(), type: 'button', content: { label: 'Get Started', url: 'https://', color: '#dc2626' } },
      { id: uid(), type: 'divider', content: { style: 'solid' } },
      { id: uid(), type: 'footer', content: { text: 'You are receiving this because you recently signed up.', company: '{{company}}' } },
    ],
  },
  {
    id: 'promotional',
    name: 'Promotional',
    description: 'Drive sales with a compelling offer',
    icon: <Megaphone className="h-5 w-5" />,
    blocks: [
      { id: uid(), type: 'header', content: { title: 'Limited Time Offer', subtitle: 'Exclusive deal for you, {{name}}' } },
      { id: uid(), type: 'image', content: { url: '', alt: 'Promotional banner', caption: '' } },
      { id: uid(), type: 'text', content: { body: 'For a limited time, enjoy exclusive access to our best products at unbeatable prices.' } },
      { id: uid(), type: 'button', content: { label: 'Shop Now', url: 'https://', color: '#dc2626' } },
      { id: uid(), type: 'footer', content: { text: 'Unsubscribe from promotional emails anytime.', company: '{{company}}' } },
    ],
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Regular updates and curated content',
    icon: <Newspaper className="h-5 w-5" />,
    blocks: [
      { id: uid(), type: 'header', content: { title: 'This Week at {{company}}', subtitle: 'Your weekly digest' } },
      { id: uid(), type: 'text', content: { body: 'Here is what happened this week. From product updates to community highlights, stay in the loop.' } },
      { id: uid(), type: 'divider', content: { style: 'solid' } },
      { id: uid(), type: 'text', content: { body: 'Featured: How to maximize your results with our latest tools and integrations.' } },
      { id: uid(), type: 'button', content: { label: 'Read More', url: 'https://', color: '#dc2626' } },
      { id: uid(), type: 'footer', content: { text: 'You subscribed to our newsletter.', company: '{{company}}' } },
    ],
  },
  {
    id: 'announcement',
    name: 'Announcement',
    description: 'Share important news or launches',
    icon: <Bell className="h-5 w-5" />,
    blocks: [
      { id: uid(), type: 'header', content: { title: 'Big News!', subtitle: 'We have something exciting to share' } },
      { id: uid(), type: 'text', content: { body: 'We are thrilled to announce a major update. This changes everything for {{name}} and the team.' } },
      { id: uid(), type: 'image', content: { url: '', alt: 'Announcement visual', caption: '' } },
      { id: uid(), type: 'button', content: { label: 'Learn More', url: 'https://', color: '#dc2626' } },
      { id: uid(), type: 'footer', content: { text: 'Stay updated with our announcements.', company: '{{company}}' } },
    ],
  },
  {
    id: 'followup',
    name: 'Follow-up',
    description: 'Re-engage after a meeting or interaction',
    icon: <RotateCcw className="h-5 w-5" />,
    blocks: [
      { id: uid(), type: 'header', content: { title: 'Following Up', subtitle: 'Thanks for your time, {{name}}' } },
      { id: uid(), type: 'text', content: { body: 'It was great connecting with you. As discussed, here are the next steps and resources we mentioned.' } },
      { id: uid(), type: 'button', content: { label: 'Schedule a Call', url: 'https://', color: '#dc2626' } },
      { id: uid(), type: 'footer', content: { text: 'This is a follow-up from our recent conversation.', company: '{{company}}' } },
    ],
  },
  {
    id: 'reengagement',
    name: 'Re-engagement',
    description: 'Win back inactive contacts',
    icon: <Trophy className="h-5 w-5" />,
    blocks: [
      { id: uid(), type: 'header', content: { title: 'We Miss You, {{name}}!', subtitle: 'It has been a while' } },
      { id: uid(), type: 'text', content: { body: 'A lot has changed since you were last here. Come see what is new and pick up where you left off.' } },
      { id: uid(), type: 'button', content: { label: 'Come Back', url: 'https://', color: '#dc2626' } },
      { id: uid(), type: 'divider', content: { style: 'solid' } },
      { id: uid(), type: 'text', content: { body: 'Not interested anymore? No hard feelings. Click below to update your preferences.' } },
      { id: uid(), type: 'footer', content: { text: 'You can unsubscribe at any time.', company: '{{company}}' } },
    ],
  },
];

// ─────────────────────────────────────────────
// HTML Export
// ─────────────────────────────────────────────

function blocksToHtml(blocks: EmailBlock[], subject: string): string {
  const renderBlock = (block: EmailBlock): string => {
    switch (block.type) {
      case 'header':
        return `
      <tr>
        <td style="padding: 40px 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-family: Arial, sans-serif;">${block.content.title || ''}</h1>
          ${block.content.subtitle ? `<p style="margin: 8px 0 0; font-size: 16px; color: #a1a1aa; font-family: Arial, sans-serif;">${block.content.subtitle}</p>` : ''}
        </td>
      </tr>`;
      case 'text':
        return `
      <tr>
        <td style="padding: 16px 30px;">
          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #d4d4d8; font-family: Arial, sans-serif;">${block.content.body || ''}</p>
        </td>
      </tr>`;
      case 'image':
        return `
      <tr>
        <td style="padding: 16px 30px; text-align: center;">
          ${block.content.url ? `<img src="${block.content.url}" alt="${block.content.alt || ''}" style="max-width: 100%; height: auto; border-radius: 8px;" />` : '<div style="background: #27272a; border-radius: 8px; padding: 40px; color: #71717a; font-family: Arial, sans-serif;">Image placeholder</div>'}
          ${block.content.caption ? `<p style="margin: 8px 0 0; font-size: 13px; color: #71717a; font-family: Arial, sans-serif;">${block.content.caption}</p>` : ''}
        </td>
      </tr>`;
      case 'button':
        return `
      <tr>
        <td style="padding: 20px 30px; text-align: center;">
          <a href="${block.content.url || '#'}" style="display: inline-block; padding: 12px 32px; background: ${block.content.color || '#dc2626'}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; font-family: Arial, sans-serif;">${block.content.label || 'Click Here'}</a>
        </td>
      </tr>`;
      case 'divider':
        return `
      <tr>
        <td style="padding: 16px 30px;">
          <hr style="border: none; border-top: 1px ${block.content.style || 'solid'} #3f3f46; margin: 0;" />
        </td>
      </tr>`;
      case 'footer':
        return `
      <tr>
        <td style="padding: 20px 30px 30px; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #71717a; font-family: Arial, sans-serif;">${block.content.text || ''}</p>
          ${block.content.company ? `<p style="margin: 4px 0 0; font-size: 12px; color: #52525b; font-family: Arial, sans-serif;">${block.content.company}</p>` : ''}
        </td>
      </tr>`;
      default:
        return '';
    }
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #09090b;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #18181b; border-radius: 12px; overflow: hidden;">
          ${blocks.map(renderBlock).join('')}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function EmailTemplateEditorPage() {
  const [view, setView] = useState<EditorView>('gallery');
  const [templateName, setTemplateName] = useState('Untitled Template');
  const [subject, setSubject] = useState('');
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [showVariables, setShowVariables] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [htmlCopied, setHtmlCopied] = useState(false);

  // ── Block operations ──

  const addBlock = useCallback((type: BlockType) => {
    const newBlock: EmailBlock = { id: uid(), type, content: makeDefaultContent(type) };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  }, []);

  const updateBlock = useCallback((id: string, field: string, value: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content: { ...b.content, [field]: value } } : b)));
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelectedBlockId(null);
  }, []);

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swap = direction === 'up' ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }, []);

  const duplicateBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const clone = { ...prev[idx], id: uid(), content: { ...prev[idx].content } };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  }, []);

  const insertVariable = useCallback((variable: string) => {
    if (!selectedBlockId) return;
    const block = blocks.find((b) => b.id === selectedBlockId);
    if (!block) return;
    const textField = block.type === 'header' ? 'title' : block.type === 'text' ? 'body' : block.type === 'footer' ? 'text' : block.type === 'button' ? 'label' : null;
    if (textField) {
      updateBlock(selectedBlockId, textField, (block.content[textField] || '') + variable);
    }
    setShowVariables(false);
  }, [selectedBlockId, blocks, updateBlock]);

  const loadPreset = useCallback((preset: TemplatePreset) => {
    setBlocks(preset.blocks.map((b) => ({ ...b, id: uid() })));
    setTemplateName(preset.name + ' Template');
    setSubject(preset.name + ' - {{company}}');
    setView('editor');
    setSelectedBlockId(null);
  }, []);

  const handleSave = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleSendTest = useCallback(() => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2000);
  }, []);

  const handleExportHtml = useCallback(() => {
    const html = blocksToHtml(blocks, subject || templateName);
    navigator.clipboard.writeText(html);
    setHtmlCopied(true);
    setTimeout(() => setHtmlCopied(false), 2000);
  }, [blocks, subject, templateName]);

  const selectedBlock = useMemo(() => blocks.find((b) => b.id === selectedBlockId), [blocks, selectedBlockId]);

  // ── Render block editor fields ──

  const renderBlockFields = (block: EmailBlock) => {
    const fieldClass = 'w-full bg-muted border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all duration-200';
    const labelClass = 'block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5';

    switch (block.type) {
      case 'header':
        return (
          <>
            <div>
              <label className={labelClass}>Title</label>
              <input className={fieldClass} value={block.content.title || ''} onChange={(e) => updateBlock(block.id, 'title', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Subtitle</label>
              <input className={fieldClass} value={block.content.subtitle || ''} onChange={(e) => updateBlock(block.id, 'subtitle', e.target.value)} />
            </div>
          </>
        );
      case 'text':
        return (
          <div>
            <label className={labelClass}>Body</label>
            <textarea className={`${fieldClass} min-h-[100px] resize-y`} value={block.content.body || ''} onChange={(e) => updateBlock(block.id, 'body', e.target.value)} />
          </div>
        );
      case 'image':
        return (
          <>
            <div>
              <label className={labelClass}>Image URL</label>
              <input className={fieldClass} value={block.content.url || ''} onChange={(e) => updateBlock(block.id, 'url', e.target.value)} placeholder="https://example.com/image.jpg" />
            </div>
            <div>
              <label className={labelClass}>Alt Text</label>
              <input className={fieldClass} value={block.content.alt || ''} onChange={(e) => updateBlock(block.id, 'alt', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Caption</label>
              <input className={fieldClass} value={block.content.caption || ''} onChange={(e) => updateBlock(block.id, 'caption', e.target.value)} />
            </div>
          </>
        );
      case 'button':
        return (
          <>
            <div>
              <label className={labelClass}>Label</label>
              <input className={fieldClass} value={block.content.label || ''} onChange={(e) => updateBlock(block.id, 'label', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>URL</label>
              <input className={fieldClass} value={block.content.url || ''} onChange={(e) => updateBlock(block.id, 'url', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={block.content.color || '#dc2626'} onChange={(e) => updateBlock(block.id, 'color', e.target.value)} className="h-8 w-8 rounded border border-white/[0.06] bg-transparent cursor-pointer" />
                <input className={fieldClass} value={block.content.color || '#dc2626'} onChange={(e) => updateBlock(block.id, 'color', e.target.value)} />
              </div>
            </div>
          </>
        );
      case 'divider':
        return (
          <div>
            <label className={labelClass}>Style</label>
            <select className={fieldClass} value={block.content.style || 'solid'} onChange={(e) => updateBlock(block.id, 'style', e.target.value)}>
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        );
      case 'footer':
        return (
          <>
            <div>
              <label className={labelClass}>Footer Text</label>
              <textarea className={`${fieldClass} min-h-[60px] resize-y`} value={block.content.text || ''} onChange={(e) => updateBlock(block.id, 'text', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Company Name</label>
              <input className={fieldClass} value={block.content.company || ''} onChange={(e) => updateBlock(block.id, 'company', e.target.value)} />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  // ── Render preview block ──

  const renderPreviewBlock = (block: EmailBlock) => {
    switch (block.type) {
      case 'header':
        return (
          <div className="px-6 py-8 text-center">
            <h1 className="text-xl font-bold text-white">{block.content.title || 'Headline'}</h1>
            {block.content.subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{block.content.subtitle}</p>}
          </div>
        );
      case 'text':
        return (
          <div className="px-6 py-3">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{block.content.body || 'Text content...'}</p>
          </div>
        );
      case 'image':
        return (
          <div className="px-6 py-3 text-center">
            {block.content.url ? (
              <img src={block.content.url} alt={block.content.alt || ''} className="max-w-full h-auto rounded-lg mx-auto" />
            ) : (
              <div className="bg-muted rounded-lg py-10 text-muted-foreground text-sm">Image placeholder</div>
            )}
            {block.content.caption && <p className="mt-1.5 text-xs text-muted-foreground">{block.content.caption}</p>}
          </div>
        );
      case 'button':
        return (
          <div className="px-6 py-4 text-center">
            <span className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: block.content.color || '#dc2626' }}>
              {block.content.label || 'Click Here'}
            </span>
          </div>
        );
      case 'divider':
        return (
          <div className="px-6 py-3">
            <hr className={`border-border border-${block.content.style || 'solid'}`} style={{ borderStyle: block.content.style || 'solid' }} />
          </div>
        );
      case 'footer':
        return (
          <div className="px-6 py-4 text-center">
            <p className="text-xs text-muted-foreground">{block.content.text || 'Footer text'}</p>
            {block.content.company && <p className="text-xs text-muted-foreground mt-1">{block.content.company}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  // ── Gallery View ──

  if (view === 'gallery') {
    return (
      <div className="min-h-screen bg-card px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Template Gallery</h1>
              <p className="text-sm text-muted-foreground mt-1">Choose a preset to start or build from scratch</p>
            </div>
            <button
              onClick={() => { setBlocks([]); setTemplateName('Untitled Template'); setSubject(''); setView('editor'); }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Blank Template
            </button>
          </div>

          {/* Preset Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className="group text-left bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 hover:border-red-500/30 hover:bg-card transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors duration-200">
                    {preset.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-white">{preset.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{preset.description}</p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  {preset.blocks.length} blocks
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Editor View ──

  return (
    <div className="min-h-screen bg-card flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-white/[0.04] bg-card backdrop-blur-xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('gallery')} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-200">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="bg-transparent text-white font-semibold text-sm border-none focus:outline-none focus:ring-0 w-56"
            placeholder="Template name..."
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-white/[0.06] text-foreground hover:bg-muted transition-all duration-200"
          >
            {htmlCopied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Code className="h-3.5 w-3.5" />}
            {htmlCopied ? 'Copied!' : 'Export HTML'}
          </button>
          <button
            onClick={handleSendTest}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-white/[0.06] text-foreground hover:bg-muted transition-all duration-200"
          >
            {testSent ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Send className="h-3.5 w-3.5" />}
            {testSent ? 'Sent!' : 'Send Test'}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all duration-200"
          >
            {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {saved ? 'Saved!' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Blocks & Properties */}
        <div className="w-72 border-r border-white/[0.04] bg-card flex flex-col overflow-y-auto">
          {/* Subject Line */}
          <div className="p-4 border-b border-white/[0.04]">
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Subject Line</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-muted border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
              placeholder="Enter subject..."
            />
          </div>

          {/* Variable Insertion */}
          <div className="p-4 border-b border-white/[0.04]">
            <button
              onClick={() => setShowVariables(!showVariables)}
              className="flex items-center gap-2 w-full text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium hover:text-foreground transition-colors duration-200"
            >
              <Variable className="h-3.5 w-3.5" />
              Insert Variable
              <ChevronDown className={`h-3 w-3 ml-auto transition-transform duration-200 ${showVariables ? 'rotate-180' : ''}`} />
            </button>
            {showVariables && (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => insertVariable(v.key)}
                    className="text-left px-2 py-1.5 text-[11px] font-mono text-red-400 bg-red-500/5 border border-red-500/10 rounded-md hover:bg-red-500/10 transition-colors duration-200"
                  >
                    {v.key}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Blocks */}
          <div className="p-4 border-b border-white/[0.04]">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Add Block</p>
            <div className="grid grid-cols-2 gap-1.5">
              {BLOCK_TYPES.map((bt) => (
                <button
                  key={bt.type}
                  onClick={() => addBlock(bt.type)}
                  className="flex items-center gap-2 px-2.5 py-2 text-xs text-foreground rounded-lg border border-white/[0.04] hover:border-red-500/30 hover:bg-muted transition-all duration-200"
                >
                  {bt.icon}
                  {bt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Block Properties */}
          {selectedBlock && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  {BLOCK_TYPES.find((bt) => bt.type === selectedBlock.type)?.label} Properties
                </p>
                <button onClick={() => setSelectedBlockId(null)} className="text-muted-foreground hover:text-foreground transition-colors duration-200">
                  <ChevronUp className="h-3 w-3" />
                </button>
              </div>
              {renderBlockFields(selectedBlock)}
            </div>
          )}
        </div>

        {/* Center - Block List */}
        <div className="flex-1 flex flex-col">
          {/* Block list header */}
          <div className="px-6 py-3 border-b border-white/[0.04] bg-card flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">{blocks.length} block{blocks.length !== 1 ? 's' : ''}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-1.5 rounded-md transition-colors duration-200 ${previewMode === 'desktop' ? 'bg-red-500/10 text-red-400' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-1.5 rounded-md transition-colors duration-200 ${previewMode === 'mobile' ? 'bg-red-500/10 text-red-400' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Block list */}
          <div className="flex-1 overflow-y-auto p-6">
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 rounded-2xl bg-card border border-white/[0.04] mb-4">
                  <Layout className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">No blocks yet</p>
                <p className="text-xs text-muted-foreground">Add blocks from the sidebar to start building</p>
              </div>
            ) : (
              <div className="space-y-2 max-w-xl mx-auto">
                {blocks.map((block, idx) => (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`group relative bg-card border rounded-xl p-3 cursor-pointer transition-all duration-200 ${
                      selectedBlockId === block.id ? 'border-red-500/40 ring-1 ring-red-500/20' : 'border-white/[0.04] hover:border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                        {BLOCK_TYPES.find((bt) => bt.type === block.type)?.label}
                      </span>
                      <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }} disabled={idx === 0} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30">
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }} disabled={idx === blocks.length - 1} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30">
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }} className="p-1 rounded text-muted-foreground hover:text-foreground">
                          <Copy className="h-3 w-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className="p-1 rounded text-muted-foreground hover:text-red-400">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate pl-5">
                      {block.type === 'header' && (block.content.title || 'Empty header')}
                      {block.type === 'text' && (block.content.body || 'Empty text').slice(0, 80)}
                      {block.type === 'image' && (block.content.url || 'No image set')}
                      {block.type === 'button' && (block.content.label || 'Button')}
                      {block.type === 'divider' && `${block.content.style || 'solid'} line`}
                      {block.type === 'footer' && (block.content.text || 'Footer').slice(0, 60)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right - Live Preview */}
        <div className="w-[420px] border-l border-white/[0.04] bg-card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.04] bg-card">
            <p className="text-xs text-muted-foreground font-medium">Live Preview</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex justify-center">
            <div
              className={`transition-all duration-300 ${
                previewMode === 'mobile' ? 'w-[320px]' : 'w-full'
              }`}
            >
              {/* Subject preview */}
              {subject && (
                <div className="mb-3 px-3 py-2 bg-card border border-white/[0.04] rounded-lg">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Subject</p>
                  <p className="text-sm text-foreground font-medium">{subject}</p>
                </div>
              )}

              {/* Email body preview */}
              <div className="bg-card border border-white/[0.04] rounded-xl overflow-hidden">
                {blocks.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-xs text-muted-foreground">Preview will appear here</p>
                  </div>
                ) : (
                  blocks.map((block) => (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={`cursor-pointer transition-all duration-150 ${
                        selectedBlockId === block.id ? 'ring-1 ring-red-500/30 ring-inset' : ''
                      }`}
                    >
                      {renderPreviewBlock(block)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
