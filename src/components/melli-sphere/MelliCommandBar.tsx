'use client';

/**
 * MelliCommandBar — natural-language command input wired to the workspace.
 *
 * Sits beneath the Melli sphere. User types things like:
 *   "load tv service"
 *   "open vpn and revenue builder"
 *   "show crm"
 *
 * Parser extracts all mentioned apps, opens each as a workspace panel via
 * window.__memelliOpenModule (exposed by OSWorkspace), or pushes a route
 * via next/navigation as a fallback.
 *
 * Props:
 *   onResponse  — callback so parent can display Melli's reply (e.g. update sphere state)
 *   onLaunch    — fires for every resolved moduleId before navigation
 *   placeholder — custom input placeholder text
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface MelliCommandBarProps {
  onResponse?: (text: string) => void;
  onLaunch?: (moduleIds: string[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/* ── App keyword map ─────────────────────────────────────────────────────── */

const APP_MAP: { keywords: string[]; id: string; title: string; route: string }[] = [
  { keywords: ['tv', 'iptv', 'live tv', 'television', 'channels', 'streaming', 'stream'],            id: 'iptv',            title: 'Live TV',          route: '/dashboard/iptv' },
  { keywords: ['vpn', 'privacy', 'tunnel', 'proxy', 'residential'],                                   id: 'vpn',             title: 'Infinity VPN',     route: '/dashboard/vpn' },
  { keywords: ['revenue', 'rev builder', 'revenue builder', 'product site', 'digital product'],       id: 'revenue-builder', title: 'Revenue Builder',  route: '/dashboard/revenue-builder' },
  { keywords: ['crm', 'contacts', 'deals', 'pipeline', 'leads pipeline'],                             id: 'crm',             title: 'CRM',              route: '/dashboard/crm' },
  { keywords: ['phone', 'calls', 'ivr', 'voice dispatch', 'call routing'],                            id: 'communications',  title: 'Phone System',     route: '/dashboard/communications' },
  { keywords: ['credit', 'credit repair', 'credit engine', 'funding', 'business credit'],             id: 'credit',          title: 'Credit Engine',    route: '/dashboard/credit' },
  { keywords: ['commerce', 'store', 'shop', 'products', 'checkout', 'stripe'],                        id: 'commerce',        title: 'Commerce',         route: '/dashboard/commerce' },
  { keywords: ['ai', 'agents', 'ai agents', 'workforce', 'automation', 'workflows'],                  id: 'agents',          title: 'AI Agents',        route: '/dashboard/ai' },
  { keywords: ['analytics', 'reports', 'revenue report', 'metrics', 'insights'],                      id: 'analytics',       title: 'Analytics',        route: '/dashboard/analytics' },
  { keywords: ['seo', 'content', 'articles', 'search engine'],                                        id: 'seo',             title: 'SEO & Content',    route: '/dashboard/seo' },
  { keywords: ['coaching', 'courses', 'programs', 'education'],                                       id: 'coaching',        title: 'Coaching',         route: '/dashboard/coaching' },
  { keywords: ['leads', 'lead gen', 'lead pulse'],                                                    id: 'leads',           title: 'Lead Pulse',       route: '/dashboard/leads' },
  { keywords: ['tasks', 'task engine', 'task'],                                                       id: 'tasks',           title: 'Task Engine',      route: '/dashboard/tasks' },
  { keywords: ['website', 'site builder', 'funnel', 'pages', 'landing page'],                        id: 'website-builder', title: 'Website Builder',  route: '/dashboard/website-builder' },
  { keywords: ['dashboard', 'home', 'overview'],                                                      id: 'dashboard',       title: 'Dashboard',        route: '/dashboard' },
];

/* ── Parser ──────────────────────────────────────────────────────────────── */

function parseCommand(input: string): typeof APP_MAP {
  const lower = input.toLowerCase();
  const matched: typeof APP_MAP = [];
  const seenIds = new Set<string>();

  for (const app of APP_MAP) {
    for (const kw of app.keywords) {
      if (lower.includes(kw) && !seenIds.has(app.id)) {
        matched.push(app);
        seenIds.add(app.id);
        break;
      }
    }
  }
  return matched;
}

function buildReply(apps: typeof APP_MAP): string {
  if (apps.length === 0) return "I didn't catch that — try saying 'load live tv' or 'open crm'.";
  if (apps.length === 1) return `Opening ${apps[0].title} now...`;
  const names = apps.map(a => a.title);
  const last = names.pop();
  return `Opening ${names.join(', ')} and ${last} for you...`;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function MelliCommandBar({
  onResponse,
  onLaunch,
  placeholder = 'Ask Melli — "load live tv" or "open crm and vpn"',
  autoFocus = false,
}: MelliCommandBarProps) {
  const [value, setValue] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    const apps = parseCommand(trimmed);
    const replyText = buildReply(apps);

    // Show reply
    setReply(replyText);
    onResponse?.(replyText);

    // Small delay so user reads the reply before navigation
    setTimeout(() => {
      const ids = apps.map(a => a.id);
      onLaunch?.(ids);

      if (apps.length > 0) {
        // Try workspace global first (works when OSWorkspace is mounted)
        const openModule = (window as any).__memelliOpenModule;
        if (typeof openModule === 'function') {
          apps.forEach(app => openModule(app.id));
        } else {
          // Fallback: navigate to the first matched route
          router.push(apps[0].route);
        }
      }

      setValue('');
      setLoading(false);
    }, 600);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') submit();
  }

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Reply bubble */}
      {reply && (
        <div className="text-center text-sm text-zinc-300 animate-fade-in px-2 leading-relaxed">
          {reply}
        </div>
      )}

      {/* Input */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={value}
          onChange={e => { setValue(e.target.value); setReply(''); }}
          onKeyDown={onKey}
          placeholder={placeholder}
          className="w-full bg-zinc-900/80 border border-zinc-700/60 rounded-2xl px-4 py-2.5 pr-12 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors"
        />
        <button
          onClick={submit}
          disabled={!value.trim() || loading}
          className="absolute right-2 w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background: value.trim() ? 'linear-gradient(135deg,#dc2626,#f97316)' : 'rgba(255,255,255,0.06)' }}
        >
          {loading ? (
            <svg className="w-3.5 h-3.5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Quick launch pills */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {['Live TV', 'VPN', 'Revenue Builder', 'CRM', 'Credit Engine'].map(label => (
          <button
            key={label}
            onClick={() => {
              const cmd = `load ${label.toLowerCase()}`;
              const apps = parseCommand(cmd);
              const replyText = buildReply(apps);
              setReply(replyText);
              onResponse?.(replyText);
              setTimeout(() => {
                const ids = apps.map(a => a.id);
                onLaunch?.(ids);
                const openModule = (window as any).__memelliOpenModule;
                if (typeof openModule === 'function') {
                  apps.forEach(app => openModule(app.id));
                } else if (apps[0]) {
                  router.push(apps[0].route);
                }
                setValue('');
                setLoading(false);
              }, 600);
            }}
            className="text-[10px] px-2.5 py-1 rounded-full border border-zinc-700/60 text-zinc-400 hover:border-red-500/40 hover:text-zinc-200 transition-all"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
