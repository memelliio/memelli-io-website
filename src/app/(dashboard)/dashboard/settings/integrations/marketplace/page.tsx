'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  CreditCard,
  Mail,
  MessageSquare,
  BarChart3,
  Share2,
  HardDrive,
  CheckCircle2,
  Settings2,
  Plug,
  SlidersHorizontal,
} from 'lucide-react';
import {
  PageHeader,
  Badge,
  Button,
  Input,
} from '@memelli/ui';

/* ---------- Types ---------- */

type CategoryId = 'all' | 'payment' | 'email' | 'sms' | 'analytics' | 'social' | 'storage';

interface MarketplaceIntegration {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  categoryLabel: string;
  connected: boolean;
}

/* ---------- Category config ---------- */

const CATEGORIES: { id: CategoryId; label: string; icon: typeof CreditCard }[] = [
  { id: 'all', label: 'All', icon: SlidersHorizontal },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'sms', label: 'SMS', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'social', label: 'Social', icon: Share2 },
  { id: 'storage', label: 'Storage', icon: HardDrive },
];

const CATEGORY_COLORS: Record<CategoryId, { badge: string; iconBg: string; iconText: string }> = {
  all:       { badge: 'bg-white/[0.06] text-white/50',         iconBg: 'bg-white/[0.06] border-white/[0.08]',           iconText: 'text-white/50' },
  payment:   { badge: 'bg-red-500/10 text-red-400',             iconBg: 'bg-red-500/10 border-red-500/20',               iconText: 'text-red-400' },
  email:     { badge: 'bg-sky-500/10 text-sky-400',              iconBg: 'bg-sky-500/10 border-sky-500/20',               iconText: 'text-sky-400' },
  sms:       { badge: 'bg-emerald-500/10 text-emerald-400',      iconBg: 'bg-emerald-500/10 border-emerald-500/20',       iconText: 'text-emerald-400' },
  analytics: { badge: 'bg-orange-500/10 text-orange-400',        iconBg: 'bg-orange-500/10 border-orange-500/20',         iconText: 'text-orange-400' },
  social:    { badge: 'bg-violet-500/10 text-violet-400',        iconBg: 'bg-violet-500/10 border-violet-500/20',         iconText: 'text-violet-400' },
  storage:   { badge: 'bg-amber-500/10 text-amber-400',          iconBg: 'bg-amber-500/10 border-amber-500/20',           iconText: 'text-amber-400' },
};

const CATEGORY_ICON_MAP: Record<Exclude<CategoryId, 'all'>, typeof CreditCard> = {
  payment: CreditCard,
  email: Mail,
  sms: MessageSquare,
  analytics: BarChart3,
  social: Share2,
  storage: HardDrive,
};

/* ---------- Integration definitions ---------- */

const INTEGRATIONS: MarketplaceIntegration[] = [
  // Payment
  { id: 'stripe',           name: 'Stripe',            description: 'Accept payments, manage subscriptions, and handle invoicing with the leading payment platform.',              category: 'payment',   categoryLabel: 'Payment',       connected: true },
  { id: 'paypal',           name: 'PayPal',            description: 'Enable PayPal checkout, send payouts, and manage buyer/seller transactions globally.',                       category: 'payment',   categoryLabel: 'Payment',       connected: false },
  // Email
  { id: 'sendgrid',         name: 'SendGrid',          description: 'Transactional and marketing email delivery with advanced analytics and template management.',                category: 'email',     categoryLabel: 'Email',         connected: true },
  { id: 'mailgun',          name: 'Mailgun',           description: 'Powerful email API for sending, receiving, and tracking messages at scale.',                                 category: 'email',     categoryLabel: 'Email',         connected: false },
  // SMS
  { id: 'twilio',           name: 'Twilio',            description: 'Voice calls, SMS messaging, and phone number management for client communications.',                        category: 'sms',       categoryLabel: 'SMS',           connected: true },
  // Analytics
  { id: 'google_analytics', name: 'Google Analytics',  description: 'Website traffic analytics, conversion tracking, audience insights, and real-time reporting.',                category: 'analytics', categoryLabel: 'Analytics',     connected: false },
  // Social
  { id: 'facebook',         name: 'Facebook',          description: 'Publish content, manage ads, track engagement, and sync audiences with Facebook.',                           category: 'social',    categoryLabel: 'Social',        connected: false },
  { id: 'instagram',        name: 'Instagram',         description: 'Schedule posts, track follower growth, and manage direct messages on Instagram.',                            category: 'social',    categoryLabel: 'Social',        connected: false },
  // Storage
  { id: 's3',               name: 'Amazon S3',         description: 'Scalable cloud object storage for files, media, backups, and static assets.',                                category: 'storage',   categoryLabel: 'Storage',       connected: false },
  { id: 'cloudflare',       name: 'Cloudflare R2',     description: 'Zero-egress-fee object storage with global CDN distribution and S3-compatible API.',                         category: 'storage',   categoryLabel: 'Storage',       connected: false },
];

/* ---------- Logo placeholder component ---------- */

function LogoPlaceholder({ name, category }: { name: string; category: CategoryId }) {
  const colors = CATEGORY_COLORS[category];
  const Icon = CATEGORY_ICON_MAP[category as Exclude<CategoryId, 'all'>] ?? Plug;
  return (
    <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${colors.iconBg}`}>
      <Icon className={`h-6 w-6 ${colors.iconText}`} />
    </div>
  );
}

/* ---------- Page component ---------- */

export default function IntegrationMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');

  /* Filter integrations */
  const filtered = useMemo(() => {
    let results = INTEGRATIONS;

    if (activeCategory !== 'all') {
      results = results.filter((i) => i.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.categoryLabel.toLowerCase().includes(q),
      );
    }

    return results;
  }, [searchQuery, activeCategory]);

  /* Count connected */
  const connectedCount = INTEGRATIONS.filter((i) => i.connected).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageHeader
        title="Integration Marketplace"
        subtitle={`Browse and connect integrations to extend your workspace. ${connectedCount} of ${INTEGRATIONS.length} connected.`}
        breadcrumb={[
          { label: 'Settings', href: '/dashboard/settings' },
          { label: 'Integrations', href: '/dashboard/settings/integrations' },
          { label: 'Marketplace' },
        ]}
      />

      {/* Search + Filter bar */}
      <div className="mt-8 space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-white/[0.06] bg-white/[0.03] text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all duration-200"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                      : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60'
                  }
                `}
              >
                <CatIcon className="h-3 w-3" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Integration grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((integration) => {
          const colors = CATEGORY_COLORS[integration.category];
          return (
            <div
              key={integration.id}
              className="rounded-2xl border border-white/[0.04] bg-white/[0.03] backdrop-blur-xl hover:border-white/[0.08] transition-all duration-200 shadow-[0_2px_20px_rgba(0,0,0,0.15)] flex flex-col"
            >
              <div className="p-4 pb-2 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <LogoPlaceholder name={integration.name} category={integration.category} />
                  <div>
                    <h3 className="text-sm font-medium text-white/85">{integration.name}</h3>
                    <span className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
                      {integration.categoryLabel}
                    </span>
                  </div>
                </div>

                {integration.connected && (
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[10px] font-medium text-emerald-400">Connected</span>
                  </div>
                )}
              </div>

              <div className="px-4 pb-4 flex-1 flex flex-col">
                <p className="text-xs text-white/30 leading-relaxed mb-4 flex-1">
                  {integration.description}
                </p>

                {integration.connected ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Settings2 className="h-3 w-3" />}
                      className="flex-1"
                    >
                      Settings
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Plug className="h-3 w-3" />}
                    className="w-full"
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="mt-8 bg-white/[0.02] border border-white/[0.04] rounded-2xl p-10 text-center backdrop-blur-xl">
          <Search className="h-8 w-8 text-white/15 mx-auto mb-3" />
          <p className="text-sm text-white/40 mb-1">No integrations found</p>
          <p className="text-xs text-white/20">
            Try adjusting your search or filter to find what you need.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="mt-4 text-xs text-red-400 hover:text-red-300 transition-colors duration-200"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Request integration CTA */}
      {filtered.length > 0 && (
        <div className="mt-6 bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 text-center backdrop-blur-xl">
          <p className="text-sm text-white/30">
            Need an integration not listed here?{' '}
            <a
              href="mailto:support@memelli.com"
              className="text-red-400 hover:text-red-300 transition-colors duration-200"
            >
              Request it
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
