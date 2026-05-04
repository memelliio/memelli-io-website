'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import nextDynamic from 'next/dynamic';
import { motion, useDragControls, useMotionValue } from 'framer-motion';
import { VoiceIntakeForm } from '../../components/onboarding/VoiceIntakeForm';
import { useAuth } from '../../contexts/auth';
import { GlobalMemelliOrbLoader } from '../../components/melli-sphere/GlobalMemelliOrbLoader';
import { useSiteConfig } from '../../hooks/useSiteConfig';
import { FloatingOrbWindow } from '../../components/FloatingOrbWindow';
import { FloatingWindow } from '../../components/FloatingWindow';

// Lazy-loaded module panels — open inside hero tabs, never as pages
const IPTVDashboard   = nextDynamic(() => import('../(dashboard)/dashboard/iptv/page'), { ssr: false });
const VpnPanel        = nextDynamic(() => import('../../components/modules/VpnPanel').then(m => ({ default: m.VpnPanel })), { ssr: false });
const CrmPanel        = nextDynamic(() => import('../../components/modules/CrmPanel').then(m => ({ default: m.CrmPanel })), { ssr: false });
const AnalyticsPanel  = nextDynamic(() => import('../../components/modules/AnalyticsPanel').then(m => ({ default: m.AnalyticsPanel })), { ssr: false });
const PhonePanel      = nextDynamic(() => import('../../components/modules/PhonePanel').then(m => ({ default: m.PhonePanel })), { ssr: false });
const CommercePanel   = nextDynamic(() => import('../../components/modules/CommercePanel').then(m => ({ default: m.CommercePanel })), { ssr: false });
const LeadsPanel      = nextDynamic(() => import('../../components/modules/LeadsPanel').then(m => ({ default: m.LeadsPanel })), { ssr: false });
const CoachingPanel   = nextDynamic(() => import('../../components/modules/CoachingPanel').then(m => ({ default: m.CoachingPanel })), { ssr: false });
const SeoPanel        = nextDynamic(() => import('../../components/modules/SeoPanel').then(m => ({ default: m.SeoPanel })), { ssr: false });
const TasksPanel      = nextDynamic(() => import('../../components/modules/TasksPanel').then(m => ({ default: m.TasksPanel })), { ssr: false });
const CreditPanel     = nextDynamic(() => import('../../components/modules/CreditPanel').then(m => ({ default: m.CreditPanel })), { ssr: false });
const AIWorkforcePanel = nextDynamic(() => import('../../components/modules/AIWorkforcePanel').then(m => ({ default: m.AIWorkforcePanel })), { ssr: false });
const ContactsPanel   = nextDynamic(() => import('../../components/modules/ContactsPanel').then(m => ({ default: m.ContactsPanel })), { ssr: false });
const RevenueBuilderPanel    = nextDynamic(() => import('../../components/modules/RevenueBuilderPanel').then(m => ({ default: m.RevenueBuilderPanel })), { ssr: false });
const DocumentsPanel         = nextDynamic(() => import('../../components/modules/DocumentsPanel').then(m => ({ default: m.DocumentsPanel })), { ssr: false });
const NotificationsPanel     = nextDynamic(() => import('../../components/modules/NotificationsPanel').then(m => ({ default: m.NotificationsPanel })), { ssr: false });
const CockpitPanel           = nextDynamic(() => import('../../components/modules/CockpitPanel').then(m => ({ default: m.CockpitPanel })), { ssr: false });
const PartnersPanel          = nextDynamic(() => import('../../components/modules/PartnersPanel').then(m => ({ default: m.PartnersPanel })), { ssr: false });
const SpeedLanesPanel        = nextDynamic(() => import('../../components/modules/SpeedLanesPanel').then(m => ({ default: m.SpeedLanesPanel })), { ssr: false });
const ActivitiesPanel        = nextDynamic(() => import('../../components/modules/ActivitiesPanel').then(m => ({ default: m.ActivitiesPanel })), { ssr: false });
const BrandEnginePanel       = nextDynamic(() => import('../../components/modules/BrandEnginePanel').then(m => ({ default: m.BrandEnginePanel })), { ssr: false });
const WebsiteBuilderPanel    = nextDynamic(() => import('../../components/modules/WebsiteBuilderPanel').then(m => ({ default: m.WebsiteBuilderPanel })), { ssr: false });
const WorkflowsPanel         = nextDynamic(() => import('../../components/modules/WorkflowsPanel').then(m => ({ default: m.WorkflowsPanel })), { ssr: false });
const CommsPanel             = nextDynamic(() => import('../../components/modules/CommsPanel').then(m => ({ default: m.CommsPanel })), { ssr: false });
const BillingPanel           = nextDynamic(() => import('../../components/modules/BillingPanel').then(m => ({ default: m.BillingPanel })), { ssr: false });
const OrganizationsPanel     = nextDynamic(() => import('../../components/modules/OrganizationsPanel').then(m => ({ default: m.OrganizationsPanel })), { ssr: false });
const ContentPanel           = nextDynamic(() => import('../../components/modules/ContentPanel').then(m => ({ default: m.ContentPanel })), { ssr: false });
const IntegrationsPanel      = nextDynamic(() => import('../../components/modules/IntegrationsPanel').then(m => ({ default: m.IntegrationsPanel })), { ssr: false });
const KnowledgePanel         = nextDynamic(() => import('../../components/modules/KnowledgePanel').then(m => ({ default: m.KnowledgePanel })), { ssr: false });
const SettingsPanel          = nextDynamic(() => import('../../components/modules/SettingsPanel').then(m => ({ default: m.SettingsPanel })), { ssr: false });
const FeedPanel              = nextDynamic(() => import('../../components/modules/FeedPanel').then(m => ({ default: m.FeedPanel })), { ssr: false });
const ApprovalPanel          = nextDynamic(() => import('../../components/modules/ApprovalPanel').then(m => ({ default: m.ApprovalPanel })), { ssr: false });
const InsightsPanel          = nextDynamic(() => import('../../components/modules/InsightsPanel').then(m => ({ default: m.InsightsPanel })), { ssr: false });
const PortalPanel            = nextDynamic(() => import('../../components/modules/PortalPanel').then(m => ({ default: m.PortalPanel })), { ssr: false });

// Dev workspace moved to /memelli-terminal — see apps/web/src/app/memelli-terminal/page.tsx

// All available hero modules — id must be unique, adminOnly restricts to SUPER_ADMIN/ADMIN
const HERO_MODULE_REGISTRY: { id: string; title: string; adminOnly: boolean }[] = [
  { id: 'iptv',        title: 'Live TV',         adminOnly: false },
  { id: 'vpn',         title: 'Infinity VPN',    adminOnly: false },
  { id: 'crm',         title: 'CRM',             adminOnly: false },
  { id: 'analytics',   title: 'Analytics',       adminOnly: false },
  { id: 'leads',       title: 'Lead Pulse',      adminOnly: false },
  { id: 'commerce',    title: 'Commerce',        adminOnly: false },
  { id: 'coaching',    title: 'Coaching',        adminOnly: false },
  { id: 'seo',         title: 'SEO & Content',   adminOnly: false },
  { id: 'tasks',       title: 'Tasks',           adminOnly: false },
  { id: 'credit',      title: 'Credit Engine',   adminOnly: false },
  { id: 'ai',          title: 'AI Workforce',    adminOnly: false },
  { id: 'contacts',    title: 'Contacts',        adminOnly: false },
  { id: 'phone',       title: 'Phone System',    adminOnly: false },
  { id: 'dev',         title: 'Dev Workspace',   adminOnly: true  },
  { id: 'revenue',     title: 'Revenue Builder', adminOnly: false },
  { id: 'documents',     title: 'Documents',       adminOnly: false },
  { id: 'notifications', title: 'Notifications',  adminOnly: false },
  { id: 'cockpit',       title: 'Cockpit',         adminOnly: true  },
  { id: 'partners',      title: 'Partners',        adminOnly: false },
  { id: 'speed',         title: 'Speed Lanes',     adminOnly: false },
  { id: 'activities',    title: 'Activity Log',    adminOnly: false },
  { id: 'brand',         title: 'Brand Engine',    adminOnly: false },
  { id: 'websites',      title: 'Website Builder', adminOnly: false },
  { id: 'workflows',     title: 'Workflows',       adminOnly: false },
  { id: 'comms',         title: 'Communications',  adminOnly: false },
  { id: 'billing',       title: 'Billing & Plan',  adminOnly: false },
  { id: 'organizations', title: 'Organizations',   adminOnly: false },
  { id: 'content',        title: 'Content Library', adminOnly: false },
  { id: 'integrations',  title: 'Integrations',    adminOnly: false },
  { id: 'knowledge',     title: 'Knowledge Base',  adminOnly: false },
  { id: 'settings',      title: 'Settings',        adminOnly: false },
  { id: 'feed',          title: 'Live Feed',       adminOnly: false },
  { id: 'approval',      title: 'Approval Center', adminOnly: false },
  { id: 'insights',      title: 'Insights',        adminOnly: false },
  { id: 'portal',        title: 'Pro Portal',      adminOnly: false },
];


/* ── Detect logged-in state (no redirect — homepage transforms inline) ── */
function useIsAuthed(): boolean {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    const token =
      localStorage.getItem('memelli_live_token') ||
      localStorage.getItem('memelli_token') ||
      localStorage.getItem('memelli_dev_token');
    setAuthed(!!token);
  }, []);
  return authed;
}

/* ── Data ────────────────────────────────────────────────────────── */

// hero_description is loaded dynamically from site config (see useSiteConfig)
const HERO_DESCRIPTION_DEFAULT = 'CRM, AI agents, commerce, coaching, phone, credit, and automation — all connected, all live, all yours. Built for entrepreneurs who move fast.';

type RowItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  bgImage?: string;
  bgColor: string;
  accent: string;
  tag?: string | null;
};

const ROWS: { label: string; items: RowItem[] }[] = [
  {
    label: '★ Members Only',
    items: [
      { id: 'revenue-builder', title: 'Revenue Builder', subtitle: 'Digital Product Sites · Stripe · Auto-Brand', href: '/dashboard/revenue-builder', bgImage: undefined, bgColor: '#1a0a00', accent: '#f97316', tag: 'Members' },
      { id: 'live-tv', title: 'Live TV', subtitle: '500+ Channels · Sports · News', href: '/dashboard/iptv', bgImage: undefined, bgColor: '#0a0f2d', accent: '#3b82f6', tag: 'Members' },
      { id: 'vpn', title: 'Infinity VPN', subtitle: 'Residential IP · Private Tunnel', href: '/dashboard/vpn', bgImage: undefined, bgColor: '#0a1a0a', accent: '#22c55e', tag: 'Members' },
    ],
  },
  {
    label: 'Core Business Engines',
    items: [
      { id: 'crm', title: 'CRM', subtitle: 'Pipelines · Deals · Contacts', href: '/crm', bgImage: 'https://d1q70pf5vjeyhc.cloudfront.net/predictions/d861bd47d2f449b389a389c38ea11c3e/1.jpg', bgColor: '#1a3a5c', accent: '#3b82f6', tag: 'Live' },
      { id: 'commerce', title: 'Commerce', subtitle: 'Stores · Products · Payments', href: '/commerce', bgImage: 'https://d1q70pf5vjeyhc.cloudfront.net/predictions/0926ec3108ca43b99f173b498f25e7f2/1.jpg', bgColor: '#3b1f00', accent: '#f97316', tag: 'New' },
      { id: 'coaching', title: 'Coaching', subtitle: 'Programs · Modules · Certs', href: '/coaching', bgImage: undefined, bgColor: '#2d1b4e', accent: '#ef4444', tag: null },
      { id: 'seo', title: 'SEO & Content', subtitle: 'AI Articles · Rankings', href: '/seo', bgImage: undefined, bgColor: '#0f3320', accent: '#22c55e', tag: null },
      { id: 'leads', title: 'Lead Pulse', subtitle: 'AI Lead Gen · Scoring', href: '/leads', bgImage: undefined, bgColor: '#3b0f0f', accent: '#ef4444', tag: 'Hot' },
      { id: 'sites', title: 'Website Builder', subtitle: 'Sites · Funnels · Pages', href: '/website-builder', bgImage: undefined, bgColor: '#0f1e3b', accent: '#f59e0b', tag: null },
      { id: 'analytics', title: 'Analytics', subtitle: 'Revenue · Cohorts · LTV', href: '/analytics-overview', bgImage: undefined, bgColor: '#1e0f2d', accent: '#ec4899', tag: null },
    ],
  },
  {
    label: 'AI & Automation',
    items: [
      { id: 'ai-workforce', title: 'AI Workforce', subtitle: '40+ Agents · 24/7 Parallel', href: '/ai-agents', bgImage: 'https://d1q70pf5vjeyhc.cloudfront.net/predictions/93b514ef2fa24e0e91080fbcd4b103c9/1.jpg', bgColor: '#0a2920', accent: '#10b981', tag: 'Live' },
      { id: 'workflows', title: 'Workflows', subtitle: 'Visual Automation · AI Triggers', href: '/automation', bgImage: undefined, bgColor: '#0f1e3b', accent: '#38bdf8', tag: null },
      { id: 'tasks', title: 'Task Engine', subtitle: 'Smart Routing · Priority Queues', href: '/tasks', bgImage: undefined, bgColor: '#2d1f00', accent: '#fbbf24', tag: null },
      { id: 'command', title: 'Command Center', subtitle: 'Dispatch · Monitor · Control', href: '/command-center', bgImage: undefined, bgColor: '#1a1a2e', accent: '#818cf8', tag: 'Admin' },
      { id: 'speed', title: 'Speed Lanes', subtitle: 'Burst AI Execution', href: '/speed-lanes', bgImage: undefined, bgColor: '#2d0f0f', accent: '#ef4444', tag: 'Fast' },
      { id: 'agents', title: 'Agent Pools', subtitle: 'Scale to Thousands', href: '/agent-pools', bgImage: undefined, bgColor: '#0f2d1a', accent: '#34d399', tag: null },
    ],
  },
  {
    label: 'Communications',
    items: [
      { id: 'phone', title: 'Phone System', subtitle: 'IVR · Routing · Transcripts', href: '/voice-dispatch', bgImage: 'https://d1q70pf5vjeyhc.cloudfront.net/predictions/00612b08d1184a2aa0d6ed89961621bd/1.jpg', bgColor: '#0f3320', accent: '#4ade80', tag: 'Live' },
      { id: 'sms', title: 'Messaging', subtitle: 'SMS · MMS · Omnichannel', href: '/messaging', bgImage: undefined, bgColor: '#2d1b4e', accent: '#f87171', tag: null },
      { id: 'email', title: 'Email', subtitle: 'Campaigns · Sequences', href: '/email', bgImage: undefined, bgColor: '#3b1f00', accent: '#fb923c', tag: null },
      { id: 'chat', title: 'Live Chat', subtitle: 'AI-First Chat Widget', href: '/chat', bgImage: undefined, bgColor: '#0f2d2d', accent: '#2dd4bf', tag: null },
      { id: 'voice-dispatch', title: 'Voice Dispatch', subtitle: 'Route to AI or Human', href: '/voice-dispatch', bgImage: undefined, bgColor: '#2d1f0f', accent: '#f59e0b', tag: null },
    ],
  },
  {
    label: 'Finance & Credit',
    items: [
      { id: 'credit', title: 'Credit Repair', subtitle: 'Disputes · Score Tracking', href: '/credit', bgImage: 'https://d1q70pf5vjeyhc.cloudfront.net/predictions/6d0db20178ae42d1bfde2a1f50c9c026/1.jpg', bgColor: '#0a2d1a', accent: '#4ade80', tag: null },
      { id: 'funding', title: 'Funding Pipeline', subtitle: 'Business Credit · Grants', href: '/funding', bgImage: undefined, bgColor: '#2d2200', accent: '#fcd34d', tag: 'New' },
      { id: 'prequal', title: 'Prequal Hub', subtitle: 'Mortgage · Prequalification', href: '/approval', bgImage: undefined, bgColor: '#0f1e3b', accent: '#93c5fd', tag: null },
      { id: 'approval', title: 'Approval Standard', subtitle: 'Business Approvals', href: '/approval', bgImage: undefined, bgColor: '#1e0f2d', accent: '#d8b4fe', tag: null },
      { id: 'payments', title: 'Payments', subtitle: 'Checkout · Plans · Invoices', href: '/payments', bgImage: undefined, bgColor: '#1a1a1a', accent: '#a1a1aa', tag: null },
    ],
  },
  {
    label: 'Companion Apps',
    items: [
      { id: 'beetv',      title: 'BeeTV',         subtitle: 'Movies · TV Shows · Free',           href: '/dashboard/companion-apps', bgImage: undefined, bgColor: '#0a1a2d', accent: '#f59e0b', tag: 'APK' },
      { id: 'tivimate',   title: 'TiviMate',       subtitle: 'IPTV Player · M3U · EPG',            href: '/dashboard/companion-apps', bgImage: undefined, bgColor: '#1a0a2d', accent: '#10b981', tag: 'APK' },
      { id: 'stremio',    title: 'Stremio',        subtitle: 'All Streaming · Torrents · Add-ons', href: '/dashboard/companion-apps', bgImage: undefined, bgColor: '#0f2d1a', accent: '#10b981', tag: 'APK' },
      { id: 'kodi',       title: 'Kodi',           subtitle: 'Open Source · Media Center',        href: '/dashboard/companion-apps', bgImage: undefined, bgColor: '#2d1a0a', accent: '#f97316', tag: 'APK' },
      { id: 'downloader', title: 'Downloader',     subtitle: 'Firestick Sideload Tool',           href: '/dashboard/companion-apps', bgImage: undefined, bgColor: '#0f1e3b', accent: '#3b82f6', tag: 'Tool' },
      { id: 'cinema-hd',  title: 'Cinema HD',      subtitle: 'HD Movies · TV · Real Debrid',      href: '/dashboard/companion-apps', bgImage: undefined, bgColor: '#2d0f1a', accent: '#ef4444', tag: 'APK' },
    ],
  },
];

/* ── FireStick-style Featured App Carousel ───────────────────────── */

const FEATURED_APPS = [
  {
    id: 'live-tv',
    title: 'Live TV',
    subtitle: '500+ Channels · Sports · News · Entertainment',
    description: 'Watch live TV, sports, news, and entertainment from inside your OS. Full DVR controls, HD streams, and curated channels — all members-only.',
    href: '/dashboard/iptv',
    badge: 'LIVE',
    badgeColor: '#ef4444',
    accent: '#3b82f6',
    glow: 'rgba(59,130,246,0.35)',
    bg: 'linear-gradient(135deg, #0a0f2d 0%, #0f1e4a 40%, #050a1a 100%)',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
      </svg>
    ),
    channels: ['ESPN · NFL · NBA', 'CNN · Fox · MSNBC', 'Discovery · HBO', 'Kids · Music · Movies'],
  },
  {
    id: 'vpn',
    title: 'Infinity VPN',
    subtitle: 'Residential IP · Private Tunnel · No Logs',
    description: 'Route all your AI agent tasks through your own residential IP. Full privacy, zero data center flags, and one-click activation for every device.',
    href: '/dashboard/vpn',
    badge: 'PRIVATE',
    badgeColor: '#22c55e',
    accent: '#22c55e',
    glow: 'rgba(34,197,94,0.3)',
    bg: 'linear-gradient(135deg, #0a1a0a 0%, #0f2d1a 40%, #050a08 100%)',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.66-2.52 7.08-6 8.1-3.48-1.02-6-4.44-6-8.1V7.67L12 5z"/>
      </svg>
    ),
    channels: ['Residential IP', 'Zero Log Policy', 'Agent Task Routing', 'Global Servers'],
  },
  {
    id: 'revenue-builder',
    title: 'Revenue Builder',
    subtitle: 'AI Digital Product Sites · Stripe · Auto-Brand',
    description: 'Generate a complete digital product site in 60 seconds — branding, checkout, SEO, phone scripts, and AI content all built in parallel.',
    href: '/dashboard/revenue-builder',
    badge: 'NEW',
    badgeColor: '#f97316',
    accent: '#f97316',
    glow: 'rgba(249,115,22,0.3)',
    bg: 'linear-gradient(135deg, #1a0a00 0%, #2d1500 40%, #0a0500 100%)',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
      </svg>
    ),
    channels: ['Stripe Checkout', 'AI Branding', 'SEO Content', 'Phone Scripts'],
  },
];

function FeaturedAppsCarousel() {
  const [active, setActive] = useState(0);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const t = setInterval(() => {
      setActive((i) => (i + 1) % FEATURED_APPS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full px-[4%] mb-10">
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">Featured for Members</h2>

      {/* All 3 cards visible — active card elevated; on mobile only active card shown */}
      <div className="flex items-end gap-3">
        {FEATURED_APPS.map((app, i) => {
          const isActive = i === active;
          return (
            <button
              key={app.id}
              onClick={() => setActive(i)}
              className={`relative rounded-xl overflow-hidden border text-left transition-all duration-300 focus:outline-none ${isActive ? 'flex-1' : 'hidden sm:flex flex-1'}`}
              style={{
                background: app.bg,
                borderColor: 'transparent',
                boxShadow: isActive ? `0 0 40px ${app.glow}, 0 12px 40px rgba(0,0,0,0.6)` : '0 8px 24px rgba(0,0,0,0.5)',
                minHeight: isActive ? 220 : 170,
                opacity: isActive ? 1 : 0.6,
                transform: isActive ? 'translateY(0)' : 'translateY(12px)',
              }}
            >
              {/* Grid lines */}
              <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }} />

              {/* Accent glow blob */}
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-2xl opacity-25" style={{ backgroundColor: app.accent }} />

              <div className="relative flex flex-col h-full p-4 md:p-5">
                {/* Badge row */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest"
                    style={{ backgroundColor: app.badgeColor, color: '#fff' }}>
                    {app.badge}
                  </span>
                  {isActive && <span className="text-[10px] text-muted-foreground">Members Only</span>}
                </div>

                {/* Icon + title */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,0,0,0.5)', color: app.accent, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                    <div className="w-5 h-5">{app.icon}</div>
                  </div>
                  <div>
                    <h3 className="font-black text-white leading-tight" style={{ fontSize: isActive ? '1.15rem' : '0.95rem' }}>{app.title}</h3>
                    <p className="text-[11px] font-medium leading-tight" style={{ color: app.accent }}>{app.subtitle}</p>
                  </div>
                </div>

                {/* Description — active only */}
                {isActive && (
                  <p className="text-muted-foreground text-xs leading-relaxed mb-3 line-clamp-2">{app.description}</p>
                )}

                {/* Feature chips */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {app.channels.slice(0, isActive ? 4 : 2).map((c) => (
                    <span key={c} className="text-[10px] px-1.5 py-0.5 rounded text-muted-foreground leading-tight" style={{ background: 'rgba(255,255,255,0.06)' }}>{c}</span>
                  ))}
                </div>

                {/* CTA button — same style on all cards */}
                <div className="mt-auto">
                  <Link
                    href={app.href}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 font-bold px-4 py-2 rounded-lg text-xs transition-all hover:scale-105"
                    style={{ background: app.accent, color: '#fff', boxShadow: `0 0 16px ${app.glow}` }}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    Open {app.title}
                  </Link>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Dot nav */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {FEATURED_APPS.map((app, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="rounded-full transition-all"
            style={{
              width: i === active ? 20 : 6,
              height: 6,
              backgroundColor: i === active ? FEATURED_APPS[active].accent : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Thumbnail card ──────────────────────────────────────────────── */

type CardProps = {
  item: RowItem;
  isLoggedIn?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
};

function Card({ item, isLoggedIn, isDragging, isDropTarget, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd }: CardProps) {
  const glow = `${item.accent}44`;

  function handleCardClick(e: React.MouseEvent) {
    if (!isLoggedIn) return;
    const fn = (window as any).__memelliOpenModule;
    if (typeof fn === 'function') {
      e.preventDefault();
      // derive module id from href: /dashboard/iptv → 'iptv'
      const id = item.href.split('/').filter(Boolean).pop() ?? item.id;
      fn(id);
    }
  }

  return (
    <div
      className="relative flex-shrink-0 w-[180px] sm:w-[220px] md:w-[250px] snap-start rounded-xl overflow-hidden group/card flex flex-col"
      draggable={isLoggedIn}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        minHeight: 160,
        opacity: isDragging ? 0.45 : 1,
        transition: 'opacity 0.15s, transform 0.2s',
        cursor: isLoggedIn ? 'grab' : undefined,
      }}
    >
      <Link
        href={item.href}
        draggable={false}
        onClick={handleCardClick}
        className="relative flex-1 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:z-20 flex flex-col"
        style={{
          background: `linear-gradient(135deg, ${item.bgColor} 0%, #0a0a0a 100%)`,
          boxShadow: isDropTarget
            ? `0 0 0 2px ${item.accent}, 0 8px 32px rgba(0,0,0,0.5)`
            : `0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)`,
          minHeight: 160,
        }}
      >
        {/* Background image */}
        {item.bgImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.bgImage} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}

        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        {/* Accent glow blob */}
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover/card:opacity-35"
          style={{ backgroundColor: item.accent }} />

        {/* Hover glow */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none"
          style={{ boxShadow: `0 0 32px ${glow}` }} />

        {/* Drag handle — 6-dot grid, visible on card hover when logged in */}
        {isLoggedIn && (
          <div
            className="absolute top-2 left-2 z-20 opacity-0 group-hover/card:opacity-60 transition-opacity pointer-events-none"
            aria-hidden="true"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="rgba(255,255,255,0.85)">
              <circle cx="4" cy="3" r="1.2" />
              <circle cx="10" cy="3" r="1.2" />
              <circle cx="4" cy="7" r="1.2" />
              <circle cx="10" cy="7" r="1.2" />
              <circle cx="4" cy="11" r="1.2" />
              <circle cx="10" cy="11" r="1.2" />
            </svg>
          </div>
        )}

        {/* Content */}
        <div className="relative flex flex-col h-full p-3.5">
          {/* Tag badge */}
          {item.tag && (
            <div className="mb-2">
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest"
                style={{ backgroundColor: item.accent, color: '#fff' }}>
                {item.tag}
              </span>
            </div>
          )}

          {/* Title + subtitle */}
          <p className="text-white font-black text-sm leading-tight mb-0.5">{item.title}</p>
          <p className="text-xs font-medium mb-3 leading-tight" style={{ color: item.accent }}>{item.subtitle}</p>

          {/* CTA button */}
          <div className="mt-auto">
            <span
              className="inline-flex items-center gap-1.5 font-bold px-3.5 py-1.5 rounded-lg text-[11px] transition-all group-hover/card:scale-105"
              style={{ background: item.accent, color: '#fff', boxShadow: `0 0 14px ${glow}` }}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Open
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ── Row ─────────────────────────────────────────────────────────── */

function Row({ label, items: initialItems, isLoggedIn }: { label: string; items: RowItem[]; isLoggedIn: boolean }) {
  const storageKey = `memelli_card_order_${label}`;

  // Restore saved card order from localStorage on first mount
  const [items, setItems] = useState<RowItem[]>(() => {
    if (typeof window === 'undefined') return initialItems;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const savedIds: string[] = JSON.parse(saved);
        const map = Object.fromEntries(initialItems.map((it) => [it.id, it]));
        const ordered = savedIds.map((id) => map[id]).filter(Boolean) as RowItem[];
        // Append any items added since the order was last saved
        const savedSet = new Set(savedIds);
        const extras = initialItems.filter((it) => !savedSet.has(it.id));
        return [...ordered, ...extras];
      }
    } catch {
      // ignore parse/storage errors
    }
    return initialItems;
  });

  const dragIndexRef = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  function scroll(dir: 'left' | 'right') {
    ref.current?.scrollBy({ left: dir === 'right' ? 620 : -620, behavior: 'smooth' });
  }

  function handleDragStart(e: React.DragEvent, index: number, id: string) {
    dragIndexRef.current = index;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetId(id);
  }

  function handleDragLeave() {
    setDropTargetId(null);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      setDropTargetId(null);
      return;
    }
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(dropIndex, 0, moved);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next.map((it) => it.id)));
      } catch {
        // ignore storage errors
      }
      return next;
    });
    setDropTargetId(null);
  }

  function handleDragEnd() {
    dragIndexRef.current = null;
    setDraggingId(null);
    setDropTargetId(null);
  }

  return (
    <div className="mb-8 group/row">
      <h2 className="px-[4%] mb-2 text-sm md:text-base font-semibold text-foreground hover:text-white cursor-default">
        {label}
        <span className="ml-2 text-xs text-red-400 font-semibold opacity-0 group-hover/row:opacity-100 transition-opacity align-middle">
          Explore All &rsaquo;
        </span>
      </h2>

      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-0 bottom-0 z-10 w-[4%] flex items-center justify-center bg-[hsl(var(--background))] hover:bg-[hsl(var(--background))] transition-all ${canLeft ? 'opacity-0 group-hover/row:opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div
          ref={ref}
          onScroll={onScroll}
          className="flex gap-1 overflow-x-auto px-[4%] snap-x snap-mandatory touch-pan-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {items.map((item, index) => (
            <Card
              key={item.id}
              item={item}
              isLoggedIn={isLoggedIn}
              isDragging={draggingId === item.id}
              isDropTarget={dropTargetId === item.id}
              onDragStart={(e) => handleDragStart(e, index, item.id)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 top-0 bottom-0 z-10 w-[4%] flex items-center justify-center bg-[hsl(var(--background))] hover:bg-[hsl(var(--background))] transition-all ${canRight ? 'opacity-0 group-hover/row:opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}



/* ── Shared modal shell ──────────────────────────────────────────── */

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-700/60 bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: 'linear-gradient(90deg,#dc2626,#f97316)' }} />
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-muted-foreground transition-colors text-lg leading-none">✕</button>
        {children}
      </div>
    </div>
  );
}

/* ── Login modal ─────────────────────────────────────────────────── */

function LoginModal({ onClose, onSwitchToSignUp }: { onClose: () => void; onSwitchToSignUp: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Login failed');
      const token = data?.token || data?.data?.token || data?.access_token;
      if (token) {
        localStorage.setItem('memelli_live_token', token);
        localStorage.setItem('memelli_token', token);
      }
      onClose();
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-7 pt-8">
        <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
        <p className="text-muted-foreground text-sm mb-6">Sign in to your Memelli workspace</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address" required autoFocus
            className="w-full bg-muted/70 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/60"
          />
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" required
              className="w-full bg-muted/70 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/60 pr-11"
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors text-xs">
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-5">
          No account?{' '}
          <button onClick={onSwitchToSignUp} className="text-red-400 hover:text-red-300 font-semibold transition-colors">
            Start free
          </button>
        </p>
      </div>
    </Modal>
  );
}

/* ── Sign up modal ───────────────────────────────────────────────── */

function SignUpModal({ onClose, onSwitchToLogin }: { onClose: () => void; onSwitchToLogin: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(k: keyof typeof form) { return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';
      const res = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.toLowerCase().trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Sign up failed');
      const token = data?.token || data?.data?.token || data?.access_token;
      if (token) {
        localStorage.setItem('memelli_live_token', token);
        localStorage.setItem('memelli_token', token);
        onClose();
        router.push('/');
      } else {
        // Needs verification — go to full start page
        onClose();
        router.push('/start');
      }
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-7 pt-8">
        <h2 className="text-xl font-bold text-white mb-1">Start free</h2>
        <p className="text-muted-foreground text-sm mb-6">Create your Memelli workspace — no credit card needed</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.firstName} onChange={set('firstName')} placeholder="First name" required autoFocus
              className="bg-muted/70 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/60" />
            <input type="text" value={form.lastName} onChange={set('lastName')} placeholder="Last name" required
              className="bg-muted/70 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/60" />
          </div>
          <input type="email" value={form.email} onChange={set('email')} placeholder="Email address" required
            className="w-full bg-muted/70 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/60" />
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Password" required minLength={8}
              className="w-full bg-muted/70 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/60 pr-11" />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors text-xs">
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}>
            {loading ? 'Creating account…' : 'Create Free Account'}
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="text-red-400 hover:text-red-300 font-semibold transition-colors">
            Sign in
          </button>
        </p>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          By creating an account you agree to our Terms of Service
        </p>
      </div>
    </Modal>
  );
}

/* ── Install button (hero CTA) ───────────────────────────────────── */

function InstallHeroButton() {
  const { canInstall, platform, installed, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Detect Android separately since usePWAInstall platform may return 'android' or fall through
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const isIOS = platform === 'ios';
  const isDesktop = !isIOS && !isAndroid;

  if (installed) return null;

  async function handleClick() {
    if (canInstall) { await install(); return; }
    setShowGuide(true);
  }

  const steps: { num: number; text: React.ReactNode }[] = isIOS ? [
    { num: 1, text: <span>Tap the <span className="text-blue-400 font-medium">Share ⎙</span> icon at the bottom of Safari</span> },
    { num: 2, text: <span>Scroll down and tap <span className="text-white font-medium">Add to Home Screen</span></span> },
    { num: 3, text: <span>Tap <span className="text-white font-medium">Add</span> — Memelli launches like a native app</span> },
  ] : isAndroid ? [
    { num: 1, text: <span>Tap the <span className="text-white font-medium">⋮ menu</span> in your browser (top right)</span> },
    { num: 2, text: <span>Tap <span className="text-white font-medium">Add to Home Screen</span> or <span className="text-white font-medium">Install App</span></span> },
    { num: 3, text: <span>Tap <span className="text-white font-medium">Add</span> — Memelli is on your home screen</span> },
  ] : [
    { num: 1, text: <span>Look for the <span className="text-white font-medium">install icon</span> <span className="text-muted-foreground">(⊕ or screen with arrow)</span> at the right end of your address bar</span> },
    { num: 2, text: <span>Click it and select <span className="text-white font-medium">Install</span></span> },
    { num: 3, text: <span>Memelli opens as a <span className="text-white font-medium">standalone desktop app</span> — no browser chrome</span> },
  ];

  const title = isIOS ? 'Install on iPhone / iPad' : isAndroid ? 'Install on Android' : 'Install Memelli.IO';

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 font-semibold px-5 py-3 rounded-xl text-sm border border-red-700/40 hover:border-red-500/60 bg-red-950/30 hover:bg-red-950/50 text-red-300 hover:text-red-200 transition-all"
      >
        <Download className="w-4 h-4" />
        Install App
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm"
          onClick={() => setShowGuide(false)}>
          <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-2xl bg-[hsl(var(--background))] shadow-2xl overflow-hidden"
            style={{ boxShadow: '0 0 60px rgba(220,38,38,0.15), 0 24px 60px rgba(0,0,0,0.7)' }}
            onClick={e => e.stopPropagation()}>
            <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#dc2626,#f97316,#dc2626)' }} />
            <button onClick={() => setShowGuide(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-muted-foreground transition-colors text-lg leading-none">✕</button>

            <div className="p-6">
              <p className="text-[10px] uppercase tracking-widest text-red-400 mb-1 font-medium">Free · No App Store Required</p>
              <p className="font-black text-white text-lg mb-5">{title}</p>

              <div className="flex flex-col gap-2.5">
                {steps.map(s => (
                  <div key={s.num} className="flex gap-3 items-start rounded-xl px-3.5 py-3"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <span className="h-5 w-5 shrink-0 flex items-center justify-center rounded-full text-[10px] font-black text-red-400"
                      style={{ background: 'rgba(220,38,38,0.15)' }}>{s.num}</span>
                    <span className="text-sm text-muted-foreground leading-snug">{s.text}</span>
                  </div>
                ))}
              </div>

              {isDesktop && (
                <p className="text-xs text-muted-foreground mt-4">
                  Works in Chrome, Edge, and Brave. Firefox does not support PWA install.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */

/* ── Draggable + fully resizable orb window (shown when logged in) ───────── */

const HomeSphereCompact = nextDynamic(
  () => import('../../components/melli-sphere/HomeSphere').then(m => ({ default: m.HomeSphere })),
  { ssr: false }
);

interface OrbChatState {
  replyText: string;
  userText: string;
  mode: 'idle' | 'listening' | 'thinking' | 'speaking';
}

function DraggableOrbWindow() {
  const dragControls = useDragControls();
  const mx = useMotionValue(typeof window !== 'undefined' ? window.innerWidth - 460 : 600);
  const my = useMotionValue(80);
  const [size, setSize] = useState({ w: 380, h: 520 });
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<OrbChatState>({ replyText: '', userText: '', mode: 'idle' });
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Listen for module open requests — load inside this window instead of full-screen
  useEffect(() => {
    (window as any).__memelliOpenModule = (id: string) => {
      setActiveModuleId(id);
      // Expand window to give module room
      setSize(prev => ({ w: Math.max(prev.w, 640), h: Math.max(prev.h, 640) }));
    };
    (window as any).__memelliLoadHero = (id: string | null) => setActiveModuleId(id);
    return () => {
      delete (window as any).__memelliOpenModule;
      delete (window as any).__memelliLoadHero;
    };
  }, []);

  // Subscribe to orb chat state
  useEffect(() => {
    (window as any).__memelliChatStateCallback = (s: OrbChatState) => setChat(s);
    return () => { delete (window as any).__memelliChatStateCallback; };
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [chat.replyText, chat.userText]);

  const startResize = useCallback((e: React.MouseEvent, edges: { e?: boolean; s?: boolean; w?: boolean; n?: boolean }) => {
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY;
    const sw = size.w, sh = size.h;
    const smx = mx.get(), smy = my.get();
    const onMove = (me: MouseEvent) => {
      const dx = me.clientX - sx, dy = me.clientY - sy;
      setSize(prev => ({
        w: edges.e ? Math.max(300, sw + dx) : edges.w ? Math.max(300, sw - dx) : prev.w,
        h: edges.s ? Math.max(400, sh + dy) : edges.n ? Math.max(400, sh - dy) : prev.h,
      }));
      if (edges.w) mx.set(smx + Math.min(dx, sw - 300));
      if (edges.n) my.set(smy + Math.min(dy, sh - 400));
    };
    const onUp = () => window.removeEventListener('mousemove', onMove);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
  }, [size.w, size.h, mx, my]);

  const send = () => {
    if (!input.trim()) return;
    const fn = (window as any).__memelliSend;
    if (typeof fn === 'function') fn(input.trim());
    setInput('');
  };

  const EDGE = 6;

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      style={{ x: mx, y: my, width: size.w, height: size.h, position: 'fixed', top: 0, left: 0, zIndex: 9980 }}
      className="select-none rounded-2xl overflow-visible shadow-2xl"
    >
      {/* Window chrome */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col"
        style={{ border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(10,10,10,0.97)' }}>

        {/* Title bar — drag handle only */}
        <div
          className="h-9 flex-shrink-0 flex items-center px-3 gap-2 cursor-grab active:cursor-grabbing"
          style={{ background: 'rgba(18,18,18,0.99)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-[11px] text-muted-foreground font-semibold tracking-wide ml-1 pointer-events-none">Melli</span>
          <div className="ml-auto flex items-center gap-1 pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500/70 animate-pulse" />
            <span className="text-[10px] text-red-400/70 font-medium">
              {chat.mode === 'listening' ? 'Listening…' : chat.mode === 'thinking' ? 'Thinking…' : chat.mode === 'speaking' ? 'Speaking…' : 'Live'}
            </span>
          </div>
        </div>

        {/* Globe — small, fixed height, centered */}
        <div className="flex-shrink-0 flex items-center justify-center py-2"
          style={{ height: 160, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          onClick={() => { const fn = (window as any).__memelliOrbClick; if (typeof fn === 'function') fn(); }}
        >
          <HomeSphereCompact state={chat.mode} size={140} />
        </div>

        {/* Chat messages — normal size, scrollable */}
        <div ref={messagesRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2" style={{ minHeight: 0 }}>
          {!chat.replyText && !chat.userText && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
              <p className="text-xs text-muted-foreground">Tap the globe or type below to start</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {['Show me the CRM', 'Open leads', 'Help with credit', 'What can you do?'].map(p => (
                  <button key={p} onClick={() => { const fn = (window as any).__memelliSend; if (typeof fn === 'function') fn(p); }}
                    className="text-[11px] text-muted-foreground hover:text-white border border-zinc-800 hover:border-red-500/40 rounded-full px-2.5 py-1 transition-all">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chat.userText && (
            <div className="self-end max-w-[85%] px-3 py-2 rounded-2xl text-sm text-white/80 text-right"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {chat.userText}
            </div>
          )}
          {chat.replyText && (
            <div className="self-start max-w-[90%] flex gap-2.5">
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black text-white mt-0.5"
                style={{ background: 'linear-gradient(135deg,#dc2626,#f97316)' }}>M</div>
              <div className="px-3 py-2 rounded-2xl text-sm text-white/90 leading-relaxed"
                style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.2)' }}>
                {chat.replyText}
              </div>
            </div>
          )}
        </div>

        {/* Text input — normal size */}
        <div className="flex-shrink-0 px-3 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a command or question…"
              className="flex-1 bg-card border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors"
            />
            <button type="submit" disabled={!input.trim()}
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: input.trim() ? 'linear-gradient(135deg,#dc2626,#f97316)' : 'rgba(255,255,255,0.06)' }}>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" /></svg>
            </button>
          </form>
        </div>
      </div>

      {/* Resize handles — all 8 sides */}
      <div className="absolute left-4 right-4 cursor-n-resize" style={{ top: -EDGE/2, height: EDGE }} onMouseDown={(e) => startResize(e, { n: true })} />
      <div className="absolute left-4 right-4 cursor-s-resize" style={{ bottom: -EDGE/2, height: EDGE }} onMouseDown={(e) => startResize(e, { s: true })} />
      <div className="absolute top-4 bottom-4 cursor-w-resize" style={{ left: -EDGE/2, width: EDGE }} onMouseDown={(e) => startResize(e, { w: true })} />
      <div className="absolute top-4 bottom-4 cursor-e-resize" style={{ right: -EDGE/2, width: EDGE }} onMouseDown={(e) => startResize(e, { e: true })} />
      <div className="absolute cursor-nw-resize" style={{ top: -EDGE/2, left: -EDGE/2, width: EDGE+8, height: EDGE+8 }} onMouseDown={(e) => startResize(e, { n: true, w: true })} />
      <div className="absolute cursor-ne-resize" style={{ top: -EDGE/2, right: -EDGE/2, width: EDGE+8, height: EDGE+8 }} onMouseDown={(e) => startResize(e, { n: true, e: true })} />
      <div className="absolute cursor-sw-resize" style={{ bottom: -EDGE/2, left: -EDGE/2, width: EDGE+8, height: EDGE+8 }} onMouseDown={(e) => startResize(e, { s: true, w: true })} />
      <div className="absolute cursor-se-resize" style={{ bottom: -EDGE/2, right: -EDGE/2, width: EDGE+8, height: EDGE+8 }} onMouseDown={(e) => startResize(e, { s: true, e: true })} />
    </motion.div>
  );
}

interface MelliChatState {
  replyText: string;
  userText: string;
  mode: 'idle' | 'listening' | 'thinking' | 'speaking';
  greeted: boolean;
  inputVal: string;
}

/* ── Renders any module by id inside hero tab or floating window ── */
function ModuleContent({ moduleId, isAdmin }: { moduleId: string; isAdmin: boolean }) {
  if (moduleId === 'iptv')      return <IPTVDashboard />;
  if (moduleId === 'vpn')       return <VpnPanel />;
  if (moduleId === 'crm')       return <CrmPanel />;
  if (moduleId === 'analytics') return <AnalyticsPanel />;
  if (moduleId === 'phone')     return <PhonePanel />;
  if (moduleId === 'commerce')  return <CommercePanel />;
  if (moduleId === 'leads')     return <LeadsPanel />;
  if (moduleId === 'coaching')  return <CoachingPanel />;
  if (moduleId === 'seo')       return <SeoPanel />;
  if (moduleId === 'tasks')     return <TasksPanel />;
  if (moduleId === 'credit')    return <CreditPanel />;
  if (moduleId === 'ai')        return <AIWorkforcePanel />;
  if (moduleId === 'contacts')  return <ContactsPanel />;
  if (moduleId === 'revenue')       return <RevenueBuilderPanel />;
  if (moduleId === 'documents')     return <DocumentsPanel />;
  if (moduleId === 'notifications') return <NotificationsPanel />;
  if (moduleId === 'cockpit')       return <CockpitPanel />;
  if (moduleId === 'partners')      return <PartnersPanel />;
  if (moduleId === 'speed')         return <SpeedLanesPanel />;
  if (moduleId === 'activities')    return <ActivitiesPanel />;
  if (moduleId === 'brand')         return <BrandEnginePanel />;
  if (moduleId === 'websites')      return <WebsiteBuilderPanel />;
  if (moduleId === 'workflows')     return <WorkflowsPanel />;
  if (moduleId === 'comms')         return <CommsPanel />;
  if (moduleId === 'billing')       return <BillingPanel />;
  if (moduleId === 'organizations') return <OrganizationsPanel />;
  if (moduleId === 'content')        return <ContentPanel />;
  if (moduleId === 'integrations')   return <IntegrationsPanel />;
  if (moduleId === 'knowledge')      return <KnowledgePanel />;
  if (moduleId === 'settings')       return <SettingsPanel />;
  if (moduleId === 'feed')           return <FeedPanel />;
  if (moduleId === 'approval')       return <ApprovalPanel />;
  if (moduleId === 'insights')       return <InsightsPanel />;
  if (moduleId === 'portal')         return <PortalPanel />;
  if (moduleId === 'dev' && isAdmin) return (
    <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground text-sm font-mono">
      <div>Dev workspace moved.</div>
      <a href="/memelli-terminal" className="text-emerald-400 underline">Open Memelli.io Terminal →</a>
    </div>
  );
  return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-mono">Module not found: {moduleId}</div>;
}

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const isAuthed = !!user;
  const isAdmin = isAuthed && (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN');
  const [heroTabs, setHeroTabs] = useState<{ id: string; moduleId: string; title: string }[]>([
    { id: 'iptv-0', moduleId: 'iptv', title: 'Live TV' },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('iptv-0');
  const [floatingWindows, setFloatingWindows] = useState<{ id: string; moduleId: string; title: string }[]>([]);
  const [showModulePicker, setShowModulePicker] = useState(false);
  const [moduleSearch, setModuleSearch] = useState('');
  const [orbVisible, setOrbVisible] = useState(true);
  const router = useRouter();
  const [modal, setModal] = useState<'login' | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const siteConfig = useSiteConfig();
  const [melliState, setMelliState] = useState<MelliChatState>({ replyText: '', userText: '', mode: 'idle', greeted: false, inputVal: '' });
  const [panelInput, setPanelInput] = useState('');

  // Dynamic content from site config — falls back to hardcoded defaults
  const heroBadgeText: string = siteConfig.hero_badge_text || 'Enjoy your own OS, built your way';
  const heroDescription: string = siteConfig.hero_description || HERO_DESCRIPTION_DEFAULT;
  const heroFeatureTags: string[] = siteConfig.hero_feature_tags || ['Voice AI', 'Live TV', 'Revenue Builder', 'CRM', 'Phone System', 'Commerce', 'Credit Engine', 'AI Agents', 'Analytics'];
  const quickPrompts: string[] = siteConfig.orb_quick_prompts || ['Help with credit', 'Access funding', 'Show me the CRM', 'Open my pipeline', 'What can you do?', 'Start free trial'];

  // Receive live chat state from the orb
  useEffect(() => {
    (window as any).__memelliChatStateCallback = (s: MelliChatState) => setMelliState(s);
    return () => { delete (window as any).__memelliChatStateCallback; };
  }, []);

  // Expose signup form opener for voice orb
  useEffect(() => {
    (window as any).__memelliShowSignup = () => setShowOnboarding(true);
    return () => { delete (window as any).__memelliShowSignup; };
  }, []);

  // __memelliOpenModule — called by dashboard route redirects (e.g. /dashboard/vpn)
  useEffect(() => {
    const openModule = (moduleId: string) => {
      const mod = HERO_MODULE_REGISTRY.find(m => m.id === moduleId);
      if (!mod) return;
      const newId = `${moduleId}-${Date.now()}`;
      setHeroTabs(tabs => {
        // Don't duplicate — just activate if already open
        const existing = tabs.find(t => t.moduleId === moduleId);
        if (existing) { setActiveTabId(existing.id); return tabs; }
        setActiveTabId(newId);
        return [...tabs, { id: newId, moduleId, title: mod.title }];
      });
    };
    (window as any).__memelliOpenModule = openModule;
    // Drain any queued calls from route redirects that happened before mount
    const queue: string[] = (window as any).__memelliPendingQueue ?? [];
    queue.forEach(openModule);
    (window as any).__memelliPendingQueue = [];
    return () => { delete (window as any).__memelliOpenModule; };
  }, []);

  // Brief loading state — avoid flash of content
  if (authLoading) return null;

  return (
    <div className="text-foreground" style={{ backgroundColor: '#0f0f0f' }}>

      {/* ── Auth modals ───────────────────────────────────────────── */}
      {modal === 'login' && <LoginModal onClose={() => setModal(null)} onSwitchToSignUp={() => { setModal(null); setShowOnboarding(true); }} />}

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative w-full">

        {/* Ambient background */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 60% 50%, rgba(120,10,5,0.25) 0%, rgba(0,0,0,0) 70%), #0f0f0f',
        }} />

        {/* Bottom fade into rows */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #0f0f0f)' }} />

        {/* ── Authenticated hero — tabbed modules, full-width each ── */}
        {isAuthed && (() => {
          const MODULES = [
            { id: 'iptv', title: 'Live TV', adminOnly: false },
            { id: 'dev', title: 'Dev Workspace', adminOnly: true },
          ].filter(m => !m.adminOnly || isAdmin);

          const activeTab = heroTabs.find(t => t.id === activeTabId) ?? heroTabs[0] ?? null;

          const addTab = (moduleId: string, title: string) => {
            const newId = `${moduleId}-${Date.now()}`;
            setHeroTabs(tabs => [...tabs, { id: newId, moduleId, title }]);
            setActiveTabId(newId);
            setShowModulePicker(false);
          };

          const closeTab = (tabId: string) => {
            setHeroTabs(tabs => {
              const next = tabs.filter(t => t.id !== tabId);
              if (activeTabId === tabId) setActiveTabId(next[next.length - 1]?.id ?? '');
              return next;
            });
          };

          const detachTab = (tab: { id: string; moduleId: string; title: string }) => {
            closeTab(tab.id);
            setFloatingWindows(w => [...w, { id: `float-${tab.moduleId}-${Date.now()}`, moduleId: tab.moduleId, title: tab.title }]);
          };

          return (
            <div className="relative w-full flex flex-col" style={{ height: 600 }}>

              {/* Tab bar */}
              <div className="flex items-center flex-shrink-0 overflow-x-auto" style={{ background: 'rgba(10,10,10,0.98)', borderBottom: '1px solid rgba(255,255,255,0.07)', height: 38, minHeight: 38 }}>
                {heroTabs.map(tab => (
                  <div
                    key={tab.id}
                    className="flex items-center gap-1.5 px-3 flex-shrink-0 cursor-pointer group"
                    style={{
                      height: '100%',
                      borderRight: '1px solid rgba(255,255,255,0.06)',
                      background: tab.id === activeTabId ? 'rgba(255,255,255,0.05)' : 'transparent',
                      borderBottom: tab.id === activeTabId ? '2px solid #dc2626' : '2px solid transparent',
                    }}
                    onClick={() => setActiveTabId(tab.id)}
                  >
                    <span className={`text-[11px] font-mono whitespace-nowrap ${tab.id === activeTabId ? 'text-foreground' : 'text-muted-foreground group-hover:text-muted-foreground'}`}>
                      {tab.title}
                    </span>
                    {/* Detach */}
                    <button
                      onClick={(e) => { e.stopPropagation(); detachTab(tab); }}
                      title="Detach into floating window"
                      className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-muted-foreground transition-all"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </button>
                    {/* Close */}
                    <button
                      onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                      className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-all text-[10px] leading-none"
                    >✕</button>
                  </div>
                ))}

                {/* + New tab button */}
                <div className="relative flex-shrink-0 ml-1">
                  {showModulePicker && <div className="fixed inset-0 z-40" onClick={() => { setShowModulePicker(false); setModuleSearch(''); }} />}
                  <button
                    onClick={() => setShowModulePicker(v => !v)}
                    className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors text-lg leading-none"
                    title="Open module"
                  >+</button>
                  {showModulePicker && (
                    <div className="absolute top-full left-0 mt-1 bg-[hsl(var(--background))] border border-zinc-700 rounded-xl overflow-hidden z-50 shadow-2xl" style={{ minWidth: 220, maxHeight: 380 }}>
                      <div className="px-2 pt-2 pb-1 border-b border-zinc-800">
                        <input
                          autoFocus
                          value={moduleSearch}
                          onChange={e => setModuleSearch(e.target.value)}
                          placeholder="Search modules…"
                          className="w-full bg-card border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[11px] text-foreground placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
                        />
                      </div>
                      <div className="overflow-y-auto flex flex-col gap-0.5 p-1.5" style={{ maxHeight: 300 }}>
                        {HERO_MODULE_REGISTRY
                          .filter(m => (!m.adminOnly || isAdmin) && (!moduleSearch || m.title.toLowerCase().includes(moduleSearch.toLowerCase())))
                          .map(m => (
                            <button
                              key={m.id}
                              onClick={() => { addTab(m.id, m.title); setModuleSearch(''); }}
                              className="text-left px-3 py-2 text-[11px] text-muted-foreground hover:bg-muted rounded-lg transition-colors font-mono"
                            >{m.title}</button>
                          ))}
                        {!orbVisible && !moduleSearch && (
                          <button
                            onClick={() => { setOrbVisible(true); setShowModulePicker(false); }}
                            className="text-left px-3 py-2 text-[11px] text-muted-foreground hover:bg-muted rounded-lg transition-colors font-mono border-t border-zinc-800 mt-0.5 pt-2"
                          >Melli Chat</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active tab content — full width */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {heroTabs.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-sm font-mono">Click + to open a module</p>
                  </div>
                )}
                {heroTabs.map(tab => (
                  <div key={tab.id} style={{ display: tab.id === activeTabId ? 'block' : 'none', height: '100%' }}>
                    <ModuleContent moduleId={tab.moduleId} isAdmin={isAdmin} />
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Guest hero — hero text left, globe right ──────────────── */}
        <div className="relative flex flex-col-reverse lg:flex-row items-stretch justify-between px-[4%] pt-6 pb-10 gap-4 lg:gap-8" style={isAuthed ? { display: 'none' } : { minHeight: 600 }}>

          {/* LEFT — hero text + intake form */}
          <div className="flex-1 max-w-xl lg:max-w-[44%] relative w-full" style={{ minHeight: 'clamp(400px, 110vw, 480px)' }}>
            <>
              {/* Guest: hero text cross-fades with intake form */}
                {/* ── Hero text — fades out when onboarding starts ── */}
                <div className="transition-all duration-500 absolute inset-0"
                  style={{ opacity: showOnboarding ? 0 : 1, pointerEvents: showOnboarding ? 'none' : 'auto', transform: showOnboarding ? 'translateY(-12px)' : 'translateY(0)' }}>
                  <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-red-500/25 bg-red-500/[0.06]">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                    {/* hero_badge_text — config key: hero_badge_text */}
                    <span className="text-xs font-medium text-red-300 tracking-wide">{heroBadgeText}</span>
                  </div>

                  <h1 className="text-[2.1rem] xs:text-4xl sm:text-6xl md:text-8xl lg:text-[6.5rem] font-black leading-none mb-4 tracking-tight sm:whitespace-nowrap">
                    <span className="text-white">MEMELLI.</span><span style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundImage: 'linear-gradient(90deg, #ef4444 0%, #f97316 60%, #ef4444 100%)', backgroundClip: 'text' }}>IO</span>
                  </h1>

                  {/* hero_description — config key: hero_description */}
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6" style={{ maxWidth: 480 }}>
                    {heroDescription}
                  </p>

                  <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <button
                      onClick={() => {
                        const onboard = (window as any).__memelliOnboard;
                        if (typeof onboard === 'function') {
                          onboard();
                        } else {
                          setShowOnboarding(true);
                        }
                      }}
                      className="flex items-center gap-2 font-bold px-7 py-3 rounded-xl text-sm transition-all hover:scale-105 active:scale-100"
                      style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white', boxShadow: '0 0 40px rgba(220,38,38,0.35)' }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      Start Free
                    </button>
                    <button onClick={() => setModal('login')}
                      className="flex items-center gap-2 font-semibold px-7 py-3 rounded-xl text-sm border border-white/10 hover:border-white/20 transition-all"
                      style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.8)' }}>
                      Sign In
                    </button>
                  </div>

                  {/* hero_feature_tags — config key: hero_feature_tags (string array) */}
                  <div className="flex flex-wrap gap-2">
                    {heroFeatureTags.map((label) => (
                      <span key={label} className="text-xs text-muted-foreground bg-card border border-zinc-800/80 px-2.5 py-1 rounded-full hover:text-muted-foreground hover:border-zinc-600 transition-all cursor-default">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ── Inline intake form — fades in ── */}
                <div className="transition-all duration-500 absolute inset-0 flex flex-col"
                  style={{ opacity: showOnboarding ? 1 : 0, pointerEvents: showOnboarding ? 'auto' : 'none', transform: showOnboarding ? 'translateY(0)' : 'translateY(16px)' }}>

                  {/* Melli chat panel — shows inside the form when active */}
                  {(melliState.replyText || melliState.userText || melliState.mode === 'listening' || (melliState.mode === 'idle' && melliState.greeted)) && (
                    <div className="mb-3 rounded-2xl overflow-hidden" style={{ background: 'rgba(10,10,10,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#dc2626,#f97316,#dc2626)' }} />
                      <div className="px-4 py-3 flex flex-col gap-2">
                        {melliState.replyText && (
                          <div className="flex items-start gap-2.5">
                            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black text-white mt-0.5"
                              style={{ background: 'linear-gradient(135deg,#dc2626,#f97316)' }}>M</div>
                            <div className="flex-1 text-sm text-white/90 leading-relaxed"
                              style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 12, padding: '8px 12px' }}>
                              {melliState.replyText}
                            </div>
                          </div>
                        )}
                        {melliState.userText && (
                          <div className="self-end text-xs text-white/60 max-w-[85%] text-right"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '6px 10px' }}>
                            {melliState.userText}
                          </div>
                        )}
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (panelInput.trim()) {
                            const send = (window as any).__memelliSend;
                            if (typeof send === 'function') send(panelInput);
                            setPanelInput('');
                          }
                        }} className="flex items-center gap-2 mt-1">
                          <input
                            value={panelInput}
                            onChange={(e) => setPanelInput(e.target.value)}
                            placeholder={melliState.mode === 'listening' ? 'Listening…' : 'Speak or type…'}
                            className="flex-1 bg-card border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors"
                          />
                          <button type="submit" disabled={!panelInput.trim()}
                            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                            style={{ background: panelInput.trim() ? 'linear-gradient(135deg,#dc2626,#f97316)' : 'rgba(255,255,255,0.06)' }}>
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" /></svg>
                          </button>
                        </form>
                        {melliState.mode === 'idle' && (
                          <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {quickPrompts.map((p) => (
                              <button key={p} onClick={() => {
                                const send = (window as any).__memelliSend;
                                if (typeof send === 'function') send(p);
                              }}
                                className="text-[11px] text-white/40 hover:text-white/80 border border-border hover:border-red-500/40 rounded-full px-2.5 py-1 transition-all">
                                {p}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <VoiceIntakeForm onComplete={() => setShowOnboarding(false)} />
                </div>
            </>
          </div>

          {/* RIGHT — globe orb (guest only) */}
          <div className="flex-1 flex items-center justify-center lg:max-w-[52%] w-full max-w-[320px] sm:max-w-full mx-auto lg:mx-0">
            <GlobalMemelliOrbLoader hero formMode={showOnboarding} />
          </div>
        </div>
      </div>

      {/* ── Detached module floating windows ─────────────────────── */}
      {floatingWindows.map((win, idx) => (
        <FloatingWindow
          key={win.id}
          title={win.title}
          defaultX={80 + idx * 44}
          defaultY={120 + idx * 44}
          onClose={() => setFloatingWindows(w => w.filter(fw => fw.id !== win.id))}
        >
          <div className="w-full h-full overflow-auto" style={{ background: 'rgba(10,10,10,0.97)' }}>
            <ModuleContent moduleId={win.moduleId} isAdmin={isAdmin} />
          </div>
        </FloatingWindow>
      ))}

      {/* ── Melli Chat orb (always fixed, above everything) ───────── */}
      {isAuthed && orbVisible && (
        <FloatingOrbWindow
          quickPrompts={quickPrompts}
          replyText={melliState.replyText}
          userText={melliState.userText}
          panelInput={panelInput}
          onPanelInputChange={setPanelInput}
          onClose={() => setOrbVisible(false)}
          onPanelSubmit={(v) => {
            const fn = (window as any).__memelliSend;
            if (typeof fn === 'function') fn(v);
            setPanelInput('');
          }}
        />
      )}

      {/* ── Content rows — the channel guide ─────────────────────── */}
      <div className="pb-20" style={{ position: 'relative', zIndex: 10 }}>
        {/* FireStick-style rotating featured apps carousel */}
        <FeaturedAppsCarousel />

        {ROWS.map((row) => (
          <Row key={row.label} label={row.label} items={row.items} isLoggedIn={isAuthed} />
        ))}

        {/* Bottom CTA row */}
        <div className="mt-12 mx-[4%] rounded-2xl border border-red-500/15 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(120,10,5,0.3) 0%, rgba(20,0,0,0.5) 100%)' }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Ready to run your entire business from one OS?</h3>
              <p className="text-muted-foreground text-sm">Start free — no credit card, no setup fees, no per-seat pricing.</p>
            </div>
            <button
              onClick={() => setShowOnboarding(true)}
              className="shrink-0 flex items-center gap-2 font-bold px-8 py-3.5 rounded-xl text-sm transition-all hover:scale-105 whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white', boxShadow: '0 0 30px rgba(220,38,38,0.3)' }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Get Started Free
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
