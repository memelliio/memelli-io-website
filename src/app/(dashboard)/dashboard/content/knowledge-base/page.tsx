'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Search,
  Book,
  BookOpen,
  Rocket,
  Map,
  Code2,
  HelpCircle,
  Wrench,
  Plus,
  Edit3,
  Save,
  X,
  ChevronRight,
  Clock,
  User,
  Tag,
  Star,
  ArrowLeft,
  Hash,
  MessageCircle,
  Sparkles,
  FileText,
  List,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/* ================================================================= */
/*  Types                                                              */
/* ================================================================= */

interface KBArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: CategoryId;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  featured: boolean;
  views: number;
}

type CategoryId =
  | 'getting-started'
  | 'platform-guide'
  | 'api-docs'
  | 'faqs'
  | 'troubleshooting';

interface Category {
  id: CategoryId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

/* ================================================================= */
/*  Categories                                                         */
/* ================================================================= */

const CATEGORIES: Category[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    icon: <Rocket className="h-4 w-4" />,
    description: 'Quick start guides and onboarding',
  },
  {
    id: 'platform-guide',
    label: 'Platform Guide',
    icon: <Map className="h-4 w-4" />,
    description: 'In-depth platform documentation',
  },
  {
    id: 'api-docs',
    label: 'API Docs',
    icon: <Code2 className="h-4 w-4" />,
    description: 'API reference and integration guides',
  },
  {
    id: 'faqs',
    label: 'FAQs',
    icon: <HelpCircle className="h-4 w-4" />,
    description: 'Frequently asked questions',
  },
  {
    id: 'troubleshooting',
    label: 'Troubleshooting',
    icon: <Wrench className="h-4 w-4" />,
    description: 'Common issues and solutions',
  },
];

/* ================================================================= */
/*  Seed Data                                                          */
/* ================================================================= */

const SEED_ARTICLES: KBArticle[] = [
  {
    id: '1',
    title: 'Welcome to Memelli Universe',
    slug: 'welcome-to-memelli-universe',
    content: `# Welcome to Memelli Universe

Your AI-powered operating system for business automation, CRM, commerce, coaching, and SEO traffic.

## What is Memelli Universe?

Memelli Universe is a comprehensive platform that brings together everything you need to run and grow your business. Powered by Melli, our AI assistant, the platform automates workflows, manages customer relationships, and drives revenue.

## Key Features

- **Commerce Engine** - Stores, products, orders, subscriptions, auctions
- **CRM Engine** - Pipelines, deals, contacts, communications
- **Coaching Engine** - Programs, modules, lessons, enrollments
- **SEO Traffic Engine** - Keyword clusters, AI article generation, rankings

## Getting Started

1. Log into your dashboard at universe.memelli.com
2. Complete your workspace setup
3. Connect your first integration
4. Start automating with Melli

## Need Help?

Click the "Ask Melli" button on any page to get instant AI-powered assistance.`,
    category: 'getting-started',
    tags: ['intro', 'onboarding', 'overview'],
    author: 'System',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-14T10:30:00Z',
    featured: true,
    views: 342,
  },
  {
    id: '2',
    title: 'Setting Up Your Workspace',
    slug: 'setting-up-workspace',
    content: `# Setting Up Your Workspace

Complete guide to configuring your Memelli Universe workspace.

## Step 1: Organization Settings

Navigate to Settings > Workspace to configure your organization details.

### Required Fields
- Organization name
- Business type
- Primary contact email
- Timezone

## Step 2: Team Members

Invite team members and assign roles:

- **Super Admin** - Full system access
- **Admin** - Management access
- **Member** - Standard operational access
- **Viewer** - Read-only access

## Step 3: Integrations

Connect external services from Settings > Integrations:

- Payment processors
- Email providers
- SMS services
- Calendar sync

## Step 4: Customize Your Dashboard

Arrange widgets and modules to match your workflow preferences.`,
    category: 'getting-started',
    tags: ['setup', 'workspace', 'configuration'],
    author: 'System',
    createdAt: '2026-03-02T00:00:00Z',
    updatedAt: '2026-03-13T14:00:00Z',
    featured: true,
    views: 218,
  },
  {
    id: '3',
    title: 'Commerce Engine Overview',
    slug: 'commerce-engine-overview',
    content: `# Commerce Engine Overview

The Commerce Engine powers your entire sales infrastructure.

## Stores

Create multiple storefronts, each with its own:
- Product catalog
- Pricing rules
- Checkout flow
- Analytics dashboard

## Products

### Product Types
- Physical products
- Digital downloads
- Services
- Subscriptions

### Pricing
- One-time pricing
- Recurring subscriptions
- Tiered pricing
- Bundle discounts

## Orders

Track orders through their lifecycle:
1. Pending
2. Processing
3. Fulfilled
4. Completed

## Affiliates

Set up affiliate programs with:
- Commission tiers
- Tracking links
- Payout management
- Performance analytics`,
    category: 'platform-guide',
    tags: ['commerce', 'stores', 'products', 'orders'],
    author: 'System',
    createdAt: '2026-03-03T00:00:00Z',
    updatedAt: '2026-03-12T09:00:00Z',
    featured: false,
    views: 156,
  },
  {
    id: '4',
    title: 'CRM Pipeline Management',
    slug: 'crm-pipeline-management',
    content: `# CRM Pipeline Management

Master your sales pipeline with Memelli's CRM engine.

## Creating Pipelines

1. Navigate to CRM > Pipelines
2. Click "Create Pipeline"
3. Define your stages
4. Set automation rules

## Pipeline Stages

Each stage can have:
- **Entry criteria** - Conditions to enter the stage
- **Exit criteria** - Conditions to move forward
- **Automations** - Actions triggered on stage change
- **Time limits** - SLA tracking

## Deal Management

### Creating Deals
- Manual creation from contacts
- Auto-created from form submissions
- Imported from external CRM

### Deal Fields
- Value and currency
- Expected close date
- Probability percentage
- Custom fields

## Reporting

Access pipeline analytics:
- Conversion rates by stage
- Average deal velocity
- Revenue forecasting
- Win/loss analysis`,
    category: 'platform-guide',
    tags: ['crm', 'pipeline', 'deals', 'sales'],
    author: 'System',
    createdAt: '2026-03-04T00:00:00Z',
    updatedAt: '2026-03-11T16:00:00Z',
    featured: true,
    views: 189,
  },
  {
    id: '5',
    title: 'REST API Authentication',
    slug: 'api-authentication',
    content: `# REST API Authentication

Two authentication methods are supported.

## JWT Bearer Token

For dashboard and application users:

\`\`\`bash
curl -X POST https://api.memelli.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "yourpassword"}'
\`\`\`

Response includes a JWT token valid for 7 days.

### Using the Token

\`\`\`bash
curl https://api.memelli.com/api/contacts \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
\`\`\`

## API Key Authentication

For external integrations and services:

\`\`\`bash
curl https://api.memelli.com/api/contacts \\
  -H "X-API-Key: YOUR_API_KEY"
\`\`\`

### Generating API Keys

1. Go to Settings > Integrations
2. Click "Generate API Key"
3. Set permissions scope
4. Store the key securely

## Rate Limits

- JWT: 1000 requests/minute
- API Key: 500 requests/minute
- Burst: 50 requests/second`,
    category: 'api-docs',
    tags: ['api', 'auth', 'jwt', 'security'],
    author: 'System',
    createdAt: '2026-03-05T00:00:00Z',
    updatedAt: '2026-03-10T11:00:00Z',
    featured: false,
    views: 267,
  },
  {
    id: '6',
    title: 'API Endpoints Reference',
    slug: 'api-endpoints-reference',
    content: `# API Endpoints Reference

Complete list of available API endpoints.

## Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/contacts | List contacts |
| POST | /api/contacts | Create contact |
| GET | /api/contacts/:id | Get contact |
| PUT | /api/contacts/:id | Update contact |
| DELETE | /api/contacts/:id | Delete contact |

## Deals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/deals | List deals |
| POST | /api/deals | Create deal |
| GET | /api/deals/:id | Get deal |
| PUT | /api/deals/:id | Update deal |

## Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List products |
| POST | /api/products | Create product |
| GET | /api/products/:id | Get product |

## Webhooks

Register webhooks to receive real-time event notifications:

\`\`\`json
{
  "url": "https://your-app.com/webhook",
  "events": ["contact.created", "deal.won", "order.completed"]
}
\`\`\``,
    category: 'api-docs',
    tags: ['api', 'endpoints', 'rest', 'reference'],
    author: 'System',
    createdAt: '2026-03-05T00:00:00Z',
    updatedAt: '2026-03-10T11:00:00Z',
    featured: false,
    views: 198,
  },
  {
    id: '7',
    title: 'How do I reset my password?',
    slug: 'reset-password',
    content: `# How do I reset my password?

## Self-Service Reset

1. Go to the login page
2. Click "Forgot Password"
3. Enter your email address
4. Check your inbox for the reset link
5. Click the link and set a new password

## Admin Reset

If you're an admin, you can reset passwords for team members:

1. Go to Settings > Team
2. Find the user
3. Click "Reset Password"
4. The user will receive an email with instructions

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

## Still Having Issues?

Contact support or ask Melli for help using the chat widget.`,
    category: 'faqs',
    tags: ['password', 'account', 'security', 'login'],
    author: 'System',
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-09T08:00:00Z',
    featured: false,
    views: 145,
  },
  {
    id: '8',
    title: 'What plans are available?',
    slug: 'available-plans',
    content: `# What plans are available?

Memelli Universe offers four plan tiers.

## Trial
- 14-day free trial
- Full feature access
- Up to 100 contacts
- Email support

## Starter
- Up to 1,000 contacts
- 2 team members
- Basic automations
- Email support

## Pro
- Up to 25,000 contacts
- 10 team members
- Advanced automations
- Priority support
- API access

## Enterprise
- Unlimited contacts
- Unlimited team members
- Custom integrations
- Dedicated support
- SLA guarantee
- Custom domain

## Upgrading

Navigate to Settings > Billing to upgrade your plan at any time. Changes take effect immediately and are prorated.`,
    category: 'faqs',
    tags: ['plans', 'pricing', 'billing', 'subscription'],
    author: 'System',
    createdAt: '2026-03-06T00:00:00Z',
    updatedAt: '2026-03-09T08:00:00Z',
    featured: false,
    views: 112,
  },
  {
    id: '9',
    title: 'Dashboard Loading Slowly',
    slug: 'dashboard-loading-slowly',
    content: `# Dashboard Loading Slowly

If your dashboard is loading slowly, try these steps.

## Quick Fixes

1. **Clear browser cache** - Press Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
2. **Disable browser extensions** - Some extensions interfere with the app
3. **Try a different browser** - Chrome or Firefox recommended
4. **Check your internet connection** - Run a speed test

## Advanced Troubleshooting

### Large Dataset
If you have many contacts or deals:
- Use filters to narrow results
- Archive old records
- Consider pagination settings

### Browser Console
Check for errors:
1. Press F12 to open developer tools
2. Go to the Console tab
3. Look for red error messages
4. Share these with support if needed

## System Status

Check our status page for any ongoing incidents that might affect performance.

## Contact Support

If the issue persists, contact support with:
- Browser and version
- Operating system
- Screenshots of any errors
- Time when the issue started`,
    category: 'troubleshooting',
    tags: ['performance', 'loading', 'slow', 'browser'],
    author: 'System',
    createdAt: '2026-03-07T00:00:00Z',
    updatedAt: '2026-03-08T12:00:00Z',
    featured: false,
    views: 98,
  },
  {
    id: '10',
    title: 'Webhook Delivery Failures',
    slug: 'webhook-delivery-failures',
    content: `# Webhook Delivery Failures

Troubleshoot webhook delivery issues.

## Common Causes

### 1. Endpoint Not Reachable
- Verify your endpoint URL is correct
- Ensure your server is running
- Check firewall rules

### 2. SSL Certificate Issues
- Webhooks require HTTPS
- Ensure your SSL certificate is valid
- Self-signed certificates are not supported

### 3. Timeout
- Endpoints must respond within 30 seconds
- Return a 2xx status code immediately
- Process webhook data asynchronously

### 4. Authentication
- If your endpoint requires auth, configure it in webhook settings
- Verify the signing secret matches

## Retry Policy

Failed webhooks are retried:
- 1st retry: 1 minute
- 2nd retry: 5 minutes
- 3rd retry: 30 minutes
- 4th retry: 2 hours
- 5th retry: 24 hours

After 5 failures, the webhook is disabled.

## Debugging

View webhook delivery logs at Settings > Webhooks > Delivery Log.`,
    category: 'troubleshooting',
    tags: ['webhooks', 'api', 'integration', 'errors'],
    author: 'System',
    createdAt: '2026-03-07T00:00:00Z',
    updatedAt: '2026-03-08T12:00:00Z',
    featured: false,
    views: 87,
  },
  {
    id: '11',
    title: 'Coaching Engine Setup',
    slug: 'coaching-engine-setup',
    content: `# Coaching Engine Setup

Build and deliver online courses and coaching programs.

## Creating a Program

1. Navigate to Coaching > Programs
2. Click "Create Program"
3. Fill in program details
4. Add modules and lessons

## Module Structure

Programs contain modules, modules contain lessons:

\`\`\`
Program
  Module 1
    Lesson 1.1
    Lesson 1.2
  Module 2
    Lesson 2.1
    Lesson 2.2
\`\`\`

## Lesson Types

- **Video** - Upload or embed video content
- **Text** - Rich text with markdown support
- **Quiz** - Multiple choice or free-form questions
- **Assignment** - File upload submissions
- **Live Session** - Scheduled video calls

## Enrollments

### Manual Enrollment
Add students directly from the program page.

### Automatic Enrollment
Trigger enrollment via:
- Product purchase
- Form submission
- Workflow automation
- API call

## Certificates

Award certificates on program completion with customizable templates.`,
    category: 'platform-guide',
    tags: ['coaching', 'courses', 'programs', 'education'],
    author: 'System',
    createdAt: '2026-03-04T00:00:00Z',
    updatedAt: '2026-03-12T09:00:00Z',
    featured: false,
    views: 134,
  },
  {
    id: '12',
    title: 'SEO Traffic Engine Guide',
    slug: 'seo-traffic-engine-guide',
    content: `# SEO Traffic Engine Guide

Drive organic traffic with AI-powered content generation.

## Keyword Clusters

### Creating Clusters
1. Go to SEO > Keywords
2. Enter a seed keyword
3. AI generates related keyword clusters
4. Review and approve clusters

### Cluster Types
- **Pillar** - Main topic pages
- **Supporting** - Related subtopic pages
- **Long-tail** - Specific question pages

## AI Article Generation

Generate SEO-optimized articles:

1. Select a keyword cluster
2. Choose article length and tone
3. AI generates draft content
4. Review, edit, and publish

## IndexNow Integration

Instantly notify search engines of new content:
- Automatic submission on publish
- Bulk submission for existing pages
- Status tracking per URL

## Rankings Tracking

Monitor your search rankings:
- Daily position updates
- Competitor comparison
- Trend visualization
- Alert on significant changes`,
    category: 'platform-guide',
    tags: ['seo', 'traffic', 'keywords', 'content'],
    author: 'System',
    createdAt: '2026-03-05T00:00:00Z',
    updatedAt: '2026-03-13T15:00:00Z',
    featured: false,
    views: 167,
  },
];

/* ================================================================= */
/*  Markdown Renderer                                                  */
/* ================================================================= */

function renderMarkdown(md: string): string {
  let html = md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
      return `<pre class="bg-card border border-border rounded-lg p-4 my-4 overflow-x-auto text-sm"><code class="text-foreground">${code
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .trim()}</code></pre>`;
    })
    // Inline code
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-muted text-red-400 px-1.5 py-0.5 rounded text-sm">$1</code>'
    )
    // Tables
    .replace(/\n\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g, (_m, header, body) => {
      const headers = header.split('|').map((h: string) => h.trim()).filter(Boolean);
      const rows = body.trim().split('\n').map((row: string) =>
        row.split('|').map((c: string) => c.trim()).filter(Boolean)
      );
      let table = '<div class="overflow-x-auto my-4"><table class="w-full text-sm border-collapse">';
      table += '<thead><tr>';
      headers.forEach((h: string) => {
        table += `<th class="text-left px-3 py-2 border-b border-border text-foreground font-medium">${h}</th>`;
      });
      table += '</tr></thead><tbody>';
      rows.forEach((row: string[]) => {
        table += '<tr>';
        row.forEach((c: string) => {
          table += `<td class="px-3 py-2 border-b border-border text-muted-foreground">${c}</td>`;
        });
        table += '</tr>';
      });
      table += '</tbody></table></div>';
      return table;
    })
    // Headers
    .replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold text-foreground mt-6 mb-2">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-foreground mt-6 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-foreground mt-8 mb-4 pb-2 border-b border-border">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-2 mb-6">$1</h1>')
    // Bold + Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="text-white"><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Ordered lists
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-6 list-decimal text-foreground mb-1">$2</li>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-6 list-disc text-foreground mb-1">$1</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="border-border my-6" />')
    // Links
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-red-400 hover:text-red-300 underline">$1</a>'
    )
    // Paragraphs (lines not already wrapped)
    .replace(/^(?!<[a-z])((?!<).+)$/gm, '<p class="text-muted-foreground mb-3 leading-relaxed">$1</p>');

  // Wrap consecutive <li> in <ul> or <ol>
  html = html.replace(
    /((?:<li class="ml-6 list-disc[^>]*>.*?<\/li>\s*)+)/g,
    '<ul class="my-3">$1</ul>'
  );
  html = html.replace(
    /((?:<li class="ml-6 list-decimal[^>]*>.*?<\/li>\s*)+)/g,
    '<ol class="my-3">$1</ol>'
  );

  return html;
}

/* ================================================================= */
/*  Extract headings for TOC                                           */
/* ================================================================= */

interface TocEntry {
  level: number;
  text: string;
  id: string;
}

function extractToc(md: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const regex = /^(#{1,4}) (.+)$/gm;
  let match;
  while ((match = regex.exec(md)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    entries.push({ level, text, id });
  }
  return entries;
}

/* ================================================================= */
/*  Format helpers                                                     */
/* ================================================================= */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

/* ================================================================= */
/*  Main Component                                                     */
/* ================================================================= */

type ViewMode = 'browse' | 'article' | 'edit';

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KBArticle[]>(SEED_ARTICLES);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [activeArticle, setActiveArticle] = useState<KBArticle | null>(null);
  const [showMelliPanel, setShowMelliPanel] = useState(false);
  const [jessicaQuery, setMelliQuery] = useState('');
  const [jessicaResponse, setMelliResponse] = useState('');
  const [tocOpen, setTocOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Editor state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<CategoryId>('getting-started');
  const [editTags, setEditTags] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editorPreview, setEditorPreview] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    let result = articles;
    if (selectedCategory !== 'all') {
      result = result.filter((a) => a.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [articles, selectedCategory, searchQuery]);

  const featuredArticles = useMemo(
    () => articles.filter((a) => a.featured),
    [articles]
  );

  const recentlyUpdated = useMemo(
    () => [...articles].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5),
    [articles]
  );

  const categoryCount = useCallback(
    (catId: CategoryId) => articles.filter((a) => a.category === catId).length,
    [articles]
  );

  // Open article
  const openArticle = useCallback((article: KBArticle) => {
    setActiveArticle(article);
    setViewMode('article');
    setShowMelliPanel(false);
    setMobileSidebarOpen(false);
  }, []);

  // Start new article
  const startNewArticle = useCallback(() => {
    setEditId(null);
    setEditTitle('');
    setEditContent('# New Article\n\nStart writing here...');
    setEditCategory(selectedCategory === 'all' ? 'getting-started' : selectedCategory);
    setEditTags('');
    setEditorPreview(false);
    setViewMode('edit');
  }, [selectedCategory]);

  // Edit existing article
  const startEditArticle = useCallback((article: KBArticle) => {
    setEditId(article.id);
    setEditTitle(article.title);
    setEditContent(article.content);
    setEditCategory(article.category);
    setEditTags(article.tags.join(', '));
    setEditorPreview(false);
    setViewMode('edit');
  }, []);

  // Save article
  const saveArticle = useCallback(() => {
    if (!editTitle.trim() || !editContent.trim()) return;

    const now = new Date().toISOString();
    const tags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editId) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === editId
            ? { ...a, title: editTitle, content: editContent, category: editCategory, tags, updatedAt: now }
            : a
        )
      );
      const updated = articles.find((a) => a.id === editId);
      if (updated) {
        setActiveArticle({
          ...updated,
          title: editTitle,
          content: editContent,
          category: editCategory,
          tags,
          updatedAt: now,
        });
      }
    } else {
      const newArticle: KBArticle = {
        id: String(Date.now()),
        title: editTitle,
        slug: editTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        content: editContent,
        category: editCategory,
        tags,
        author: 'Admin',
        createdAt: now,
        updatedAt: now,
        featured: false,
        views: 0,
      };
      setArticles((prev) => [newArticle, ...prev]);
      setActiveArticle(newArticle);
    }
    setViewMode('article');
  }, [editId, editTitle, editContent, editCategory, editTags, articles]);

  // Delete article
  const deleteArticle = useCallback(
    (id: string) => {
      setArticles((prev) => prev.filter((a) => a.id !== id));
      if (activeArticle?.id === id) {
        setActiveArticle(null);
        setViewMode('browse');
      }
    },
    [activeArticle]
  );

  // Ask Melli
  const askMelli = useCallback(() => {
    if (!jessicaQuery.trim()) return;
    const q = jessicaQuery.toLowerCase();
    const matches = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
    if (matches.length > 0) {
      const top = matches[0];
      const snippet = top.content.split('\n').filter((l) => l.toLowerCase().includes(q))[0] || top.content.split('\n').slice(1, 3).join(' ');
      setMelliResponse(
        `I found ${matches.length} article${matches.length > 1 ? 's' : ''} related to "${jessicaQuery}". The most relevant is "${top.title}". ${snippet.replace(/[#*`]/g, '').trim().slice(0, 200)}...`
      );
    } else {
      setMelliResponse(
        `I couldn't find articles matching "${jessicaQuery}". Try different keywords, or create a new article to document this topic.`
      );
    }
    setMelliQuery('');
  }, [jessicaQuery, articles]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (viewMode !== 'browse') {
          setViewMode('browse');
        }
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [viewMode]);

  /* ----- TOC for active article ----- */
  const toc = useMemo(
    () => (activeArticle ? extractToc(activeArticle.content) : []),
    [activeArticle]
  );

  /* ----- Category label helper ----- */
  const getCategoryLabel = (id: CategoryId) =>
    CATEGORIES.find((c) => c.id === id)?.label ?? id;

  /* ================================================================= */
  /*  Render                                                             */
  /* ================================================================= */

  return (
    <div className="flex h-[calc(100dvh-64px)] bg-card text-foreground overflow-hidden">
      {/* ---- Mobile sidebar toggle ---- */}
      <button
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 bg-card border border-border rounded-lg p-2 text-muted-foreground hover:text-white"
      >
        <Book className="h-5 w-5" />
      </button>

      {/* ============================================================= */}
      {/*  SIDEBAR                                                        */}
      {/* ============================================================= */}
      <aside
        className={`${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-40 w-64 h-full bg-card backdrop-blur border-r border-border flex flex-col transition-transform duration-200`}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-bold text-white">Knowledge Base</h2>
          </div>
          <p className="text-xs text-muted-foreground">Internal wiki & documentation</p>
        </div>

        {/* Categories */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setViewMode('browse');
              setMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedCategory === 'all' && viewMode === 'browse'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>All Articles</span>
            <span className="ml-auto text-xs text-muted-foreground">{articles.length}</span>
          </button>

          <div className="pt-3 pb-1 px-3">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Categories
            </span>
          </div>

          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setViewMode('browse');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === cat.id && viewMode === 'browse'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{categoryCount(cat.id)}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-border space-y-2">
          <button
            onClick={startNewArticle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Article
          </button>
          <button
            onClick={() => setShowMelliPanel(!showMelliPanel)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-muted hover:bg-muted text-foreground rounded-lg text-sm transition-colors border border-border"
          >
            <Sparkles className="h-4 w-4 text-red-400" />
            Ask Melli
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background z-30"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ============================================================= */}
      {/*  MAIN CONTENT                                                    */}
      {/* ============================================================= */}
      <main className="flex-1 overflow-y-auto">
        {/* ---- BROWSE VIEW ---- */}
        {viewMode === 'browse' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            {/* Search bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, tags, content...  (Ctrl+K)"
                className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Featured section (only when no search & all categories) */}
            {!searchQuery && selectedCategory === 'all' && featuredArticles.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-4 w-4 text-red-500" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Featured Articles
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {featuredArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => openArticle(article)}
                      className="text-left bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-border hover:border-red-500/30 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-red-500/5 group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-wider text-red-400 font-medium">
                          {getCategoryLabel(article.category)}
                        </span>
                        <Star className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-white mb-2 line-clamp-2">
                        {article.title}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.views}
                        </span>
                        <span>{formatDate(article.updatedAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Recently Updated feed (only when no search & all categories) */}
            {!searchQuery && selectedCategory === 'all' && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Recently Updated
                  </h3>
                </div>
                <div className="bg-card border border-border rounded-xl divide-y divide-zinc-800/50">
                  {recentlyUpdated.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => openArticle(article)}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{article.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {getCategoryLabel(article.category)}
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {timeAgo(article.updatedAt)}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Category header */}
            {selectedCategory !== 'all' && (
              <div className="mb-4">
                <h3 className="text-lg font-bold text-foreground">
                  {getCategoryLabel(selectedCategory as CategoryId)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {CATEGORIES.find((c) => c.id === selectedCategory)?.description}
                </p>
              </div>
            )}

            {/* Search results header */}
            {searchQuery && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''} for{' '}
                  <span className="text-red-400">"{searchQuery}"</span>
                </p>
              </div>
            )}

            {/* Article list */}
            {filteredArticles.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No articles found</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Try different search terms or create a new article
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(searchQuery || selectedCategory !== 'all'
                  ? filteredArticles
                  : filteredArticles
                ).map((article) => (
                  <button
                    key={article.id}
                    onClick={() => openArticle(article)}
                    className="w-full text-left bg-card border border-border hover:border-border rounded-xl px-5 py-4 transition-all hover:bg-card group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                            {getCategoryLabel(article.category)}
                          </span>
                          {article.featured && (
                            <Star className="h-3 w-3 text-red-500 fill-red-500" />
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-foreground group-hover:text-white mb-1.5">
                          {article.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {article.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {article.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(article.updatedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.views}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-muted-foreground mt-2 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---- ARTICLE VIEW ---- */}
        {viewMode === 'article' && activeArticle && (
          <div className="flex">
            {/* Article body */}
            <div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-6">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <button
                  onClick={() => setViewMode('browse')}
                  className="flex items-center gap-1 text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
                <span>/</span>
                <button
                  onClick={() => {
                    setSelectedCategory(activeArticle.category);
                    setViewMode('browse');
                  }}
                  className="text-muted-foreground hover:text-red-400 transition-colors"
                >
                  {getCategoryLabel(activeArticle.category)}
                </button>
                <span>/</span>
                <span className="text-muted-foreground truncate max-w-[200px]">
                  {activeArticle.title}
                </span>
              </div>

              {/* Article meta */}
              <div className="flex items-center flex-wrap gap-3 mb-6">
                <span className="text-[10px] uppercase tracking-wider bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full font-medium border border-red-500/20">
                  {getCategoryLabel(activeArticle.category)}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {activeArticle.author}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Updated {formatDate(activeArticle.updatedAt)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  {activeArticle.views} views
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => startEditArticle(activeArticle)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors bg-muted px-2.5 py-1.5 rounded-lg border border-border hover:border-red-500/30"
                  >
                    <Edit3 className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteArticle(activeArticle.id)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors bg-muted px-2.5 py-1.5 rounded-lg border border-border hover:border-red-500/30"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              {activeArticle.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {activeArticle.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border"
                    >
                      <Hash className="h-2.5 w-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Rendered content */}
              <article
                className="prose-dark"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(activeArticle.content) }}
              />
            </div>

            {/* Table of contents sidebar */}
            {toc.length > 1 && (
              <aside className="hidden xl:block w-56 shrink-0 pr-4 py-6">
                <div className="sticky top-6">
                  <button
                    onClick={() => setTocOpen(!tocOpen)}
                    className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-3 hover:text-foreground transition-colors"
                  >
                    <List className="h-3.5 w-3.5" />
                    On this page
                    {tocOpen ? (
                      <ChevronUp className="h-3 w-3 ml-auto" />
                    ) : (
                      <ChevronDown className="h-3 w-3 ml-auto" />
                    )}
                  </button>
                  {tocOpen && (
                    <nav className="space-y-1 border-l border-border pl-3">
                      {toc
                        .filter((e) => e.level <= 3)
                        .map((entry, i) => (
                          <a
                            key={i}
                            href={`#${entry.id}`}
                            className={`block text-[11px] leading-relaxed transition-colors hover:text-red-400 ${
                              entry.level === 1
                                ? 'text-foreground font-medium'
                                : entry.level === 2
                                ? 'text-muted-foreground pl-2'
                                : 'text-muted-foreground pl-4'
                            }`}
                          >
                            {entry.text}
                          </a>
                        ))}
                    </nav>
                  )}
                </div>
              </aside>
            )}
          </div>
        )}

        {/* ---- EDIT VIEW ---- */}
        {viewMode === 'edit' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            {/* Editor header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (activeArticle) setViewMode('article');
                    else setViewMode('browse');
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-bold text-white">
                  {editId ? 'Edit Article' : 'New Article'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditorPreview(!editorPreview)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors ${
                    editorPreview
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
                <button
                  onClick={saveArticle}
                  disabled={!editTitle.trim() || !editContent.trim()}
                  className="flex items-center gap-1.5 text-xs px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </button>
              </div>
            </div>

            {/* Title */}
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Article title..."
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-lg font-semibold text-white placeholder:text-muted-foreground focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 mb-4 transition-colors"
            />

            {/* Category + Tags row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-wide mb-1.5 font-medium">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as CategoryId)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-red-500/50 transition-colors appearance-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-wide mb-1.5 font-medium">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="e.g. api, auth, setup"
                  className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-red-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Editor / Preview */}
            {editorPreview ? (
              <div className="bg-card border border-border rounded-xl p-6 min-h-[400px]">
                <article
                  className="prose-dark"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent) }}
                />
              </div>
            ) : (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Write your article in Markdown..."
                className="w-full bg-card border border-border rounded-xl px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 font-mono min-h-[400px] resize-y transition-colors"
              />
            )}
          </div>
        )}
      </main>

      {/* ============================================================= */}
      {/*  JESSICA PANEL                                                   */}
      {/* ============================================================= */}
      {showMelliPanel && (
        <aside className="w-80 bg-card backdrop-blur border-l border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-bold text-white">Ask Melli</h3>
            </div>
            <button
              onClick={() => setShowMelliPanel(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-xs text-muted-foreground mb-4">
              Ask Melli anything about the knowledge base. She will search articles and provide
              relevant answers.
            </p>

            {jessicaResponse && (
              <div className="bg-muted border border-border rounded-xl p-3 mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3 w-3 text-red-400" />
                  <span className="text-[11px] font-medium text-red-400">Melli</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{jessicaResponse}</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={jessicaQuery}
                onChange={(e) => setMelliQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askMelli()}
                placeholder="Ask a question..."
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-red-500/50 transition-colors"
              />
              <button
                onClick={askMelli}
                disabled={!jessicaQuery.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white p-2 rounded-lg transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
