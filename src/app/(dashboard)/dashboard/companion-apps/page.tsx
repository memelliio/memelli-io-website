'use client';

import Link from 'next/link';

/* ── App data ────────────────────────────────────────────────────── */

type Platform = 'Firestick' | 'Android TV' | 'Android Phone';

type AppEntry = {
  id: string;
  title: string;
  description: string;
  tag: 'APK' | 'Tool';
  accent: string;
  bgColor: string;
  platforms: Platform[];
  downloadUrl: string;
  icon: React.ReactNode;
};

const APPS: AppEntry[] = [
  {
    id: 'beetv',
    title: 'BeeTV',
    description: 'Free on-demand movies and TV shows streamed from top sources. No subscription required — just install and watch.',
    tag: 'APK',
    accent: '#f59e0b',
    bgColor: '#0a1a2d',
    platforms: ['Firestick', 'Android TV', 'Android Phone'],
    downloadUrl: 'https://beetvapk.net',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
        <rect width="40" height="40" rx="10" fill="#f59e0b" fillOpacity="0.15" />
        <ellipse cx="20" cy="20" rx="10" ry="7" fill="#f59e0b" fillOpacity="0.9" />
        <ellipse cx="20" cy="20" rx="4" ry="4" fill="#0a1a2d" />
        <line x1="16" y1="14" x2="12" y2="10" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="24" y1="14" x2="28" y2="10" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="20" x2="8" y2="20" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="27" y1="20" x2="32" y2="20" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'tivimate',
    title: 'TiviMate',
    description: 'The gold-standard IPTV player for Android TV. Supports M3U playlists, EPG guide data, catch-up TV, and multiple streams.',
    tag: 'APK',
    accent: '#10b981',
    bgColor: '#1a0a2d',
    platforms: ['Firestick', 'Android TV'],
    downloadUrl: 'https://tivimate.com',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
        <rect width="40" height="40" rx="10" fill="#10b981" fillOpacity="0.15" />
        <rect x="8" y="11" width="24" height="15" rx="2" stroke="#10b981" strokeWidth="1.8" />
        <line x1="20" y1="26" x2="20" y2="31" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="14" y1="31" x2="26" y2="31" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
        <polygon points="17,15 17,23 25,19" fill="#10b981" />
      </svg>
    ),
  },
  {
    id: 'stremio',
    title: 'Stremio',
    description: 'Your all-in-one streaming hub. Add-ons unlock torrents, Debrid, and every major catalog — all in one beautiful interface.',
    tag: 'APK',
    accent: '#10b981',
    bgColor: '#0f2d1a',
    platforms: ['Firestick', 'Android TV', 'Android Phone'],
    downloadUrl: 'https://www.stremio.com/downloads',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
        <rect width="40" height="40" rx="10" fill="#10b981" fillOpacity="0.15" />
        <circle cx="20" cy="20" r="10" stroke="#10b981" strokeWidth="1.8" />
        <polygon points="17,15 17,25 27,20" fill="#10b981" />
      </svg>
    ),
  },
  {
    id: 'kodi',
    title: 'Kodi',
    description: 'The legendary open-source media center. Add-ons, local media, streaming repos, and complete customization — no limits.',
    tag: 'APK',
    accent: '#f97316',
    bgColor: '#2d1a0a',
    platforms: ['Firestick', 'Android TV', 'Android Phone'],
    downloadUrl: 'https://kodi.tv/download',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
        <rect width="40" height="40" rx="10" fill="#f97316" fillOpacity="0.15" />
        <path d="M10 12 L10 28 L18 20 Z" fill="#f97316" />
        <path d="M18 20 L26 12 L30 12 L22 20 L30 28 L26 28 Z" fill="#f97316" />
      </svg>
    ),
  },
  {
    id: 'downloader',
    title: 'Downloader',
    description: 'The essential sideloading tool for Firestick. Browse any URL or direct APK link and install apps not in the Amazon store.',
    tag: 'Tool',
    accent: '#3b82f6',
    bgColor: '#0f1e3b',
    platforms: ['Firestick', 'Android TV'],
    downloadUrl: 'https://troypoint.com/downloader',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
        <rect width="40" height="40" rx="10" fill="#3b82f6" fillOpacity="0.15" />
        <line x1="20" y1="9" x2="20" y2="25" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
        <polyline points="13,19 20,26 27,19" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <line x1="10" y1="31" x2="30" y2="31" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'cinema-hd',
    title: 'Cinema HD',
    description: 'High-definition movies and TV shows with Real-Debrid support for premium, buffer-free 4K streams. One of the best free APKs.',
    tag: 'APK',
    accent: '#ef4444',
    bgColor: '#2d0f1a',
    platforms: ['Firestick', 'Android TV', 'Android Phone'],
    downloadUrl: 'https://cinemahdapk.com',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
        <rect width="40" height="40" rx="10" fill="#ef4444" fillOpacity="0.15" />
        <rect x="7" y="14" width="26" height="16" rx="2" stroke="#ef4444" strokeWidth="1.8" />
        <line x1="7" y1="18" x2="33" y2="18" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="7" y1="26" x2="33" y2="26" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="13" y1="14" x2="13" y2="30" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="27" y1="14" x2="27" y2="30" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.5" />
        <circle cx="20" cy="22" r="3" fill="#ef4444" />
      </svg>
    ),
  },
];

/* ── Platform badge ──────────────────────────────────────────────── */

const PLATFORM_COLORS: Record<Platform, { bg: string; text: string }> = {
  'Firestick':     { bg: 'rgba(249,115,22,0.15)',  text: '#fb923c' },
  'Android TV':    { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80' },
  'Android Phone': { bg: 'rgba(99,102,241,0.15)',  text: '#818cf8' },
};

function PlatformBadge({ platform }: { platform: Platform }) {
  const colors = PLATFORM_COLORS[platform];
  return (
    <span
      className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: colors.bg, color: colors.text }}
    >
      {platform}
    </span>
  );
}

/* ── App card ────────────────────────────────────────────────────── */

function AppCard({ app }: { app: AppEntry }) {
  const vpnUrl = `/dashboard/vpn-browser?url=${encodeURIComponent(app.downloadUrl)}`;

  return (
    <div
      className="relative flex flex-col rounded-2xl overflow-hidden border border-border transition-all duration-200 hover:border-border hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(145deg, ${app.bgColor} 0%, #0a0a0a 100%)`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
      }}
    >
      {/* Tag pill */}
      <div className="absolute top-3 right-3">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide"
          style={{ background: `${app.accent}22`, color: app.accent, border: `1px solid ${app.accent}44` }}
        >
          {app.tag}
        </span>
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Icon + title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex-shrink-0">
            {app.icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-bold text-base leading-tight">{app.title}</h3>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {app.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-sm leading-relaxed flex-1">{app.description}</p>

        {/* Download button */}
        <Link
          href={vpnUrl}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${app.accent}cc, ${app.accent}88)`,
            boxShadow: `0 0 16px ${app.accent}33`,
          }}
        >
          <DownloadIcon />
          Download via VPN
        </Link>
      </div>
    </div>
  );
}

/* ── Inline SVG icons ────────────────────────────────────────────── */

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v11m0 0l-4-4m4 4l4-4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}

/* ── Sideload steps ──────────────────────────────────────────────── */

const SIDELOAD_STEPS = [
  {
    n: '1',
    title: 'Enable Unknown Sources',
    body: 'On your Firestick go to Settings → My Fire TV → Developer Options → Install Unknown Apps, then toggle ON for the Downloader app.',
  },
  {
    n: '2',
    title: 'Install Downloader',
    body: 'Search "Downloader" in the Amazon App Store and install it. This is the bridge that lets you grab APKs from any URL.',
  },
  {
    n: '3',
    title: 'Open Downloader & Enter URL',
    body: 'Launch Downloader, tap the URL bar, and type the APK download link. Use the VPN Browser links above to get the exact URL from each app\'s official site.',
  },
  {
    n: '4',
    title: 'Install the APK',
    body: 'Once the file downloads, Downloader will prompt you to install it. Tap Install, then Done. The app will appear in your app list.',
  },
  {
    n: '5',
    title: 'Stay Private',
    body: 'Always download and stream through your Infinity VPN. Activate it from the VPN tile in your dashboard before launching any of these apps.',
  },
];

/* ── Page ────────────────────────────────────────────────────────── */

export default function CompanionAppsPage() {
  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-border"
        style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <BackIcon />
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white font-bold text-sm truncate">Companion Apps</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRightIcon />
          <span className="text-muted-foreground">Companion Apps</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-widest uppercase"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              APK Catalog
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Companion Apps</h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
            Sideload the best streaming apps to your Firestick, Android TV, or phone.
            All downloads open inside your Infinity VPN browser for maximum privacy.
          </p>
        </div>

        {/* ── Privacy notice ───────────────────────────────────── */}
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-xl border"
          style={{
            background: 'rgba(34,197,94,0.06)',
            borderColor: 'rgba(34,197,94,0.2)',
          }}
        >
          <span className="text-green-400 mt-0.5 flex-shrink-0"><ShieldIcon /></span>
          <p className="text-sm text-foreground leading-relaxed">
            <span className="text-green-400 font-semibold">Privacy-first downloads.</span>{' '}
            Every "Download via VPN" button opens the app's official site inside your{' '}
            <Link href="/dashboard/vpn" className="text-green-400 underline underline-offset-2 hover:text-green-300 transition-colors">
              Infinity VPN browser
            </Link>
            {' '}— your IP is masked and your downloads are not logged. Make sure your VPN is active before downloading.
          </p>
        </div>

        {/* ── App grid ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-medium">Available Apps</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {APPS.map(app => <AppCard key={app.id} app={app} />)}
          </div>
        </section>

        {/* ── Sideload instructions ─────────────────────────────── */}
        <section
          className="rounded-2xl border border-border overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #111111 0%, #0a0a0a 100%)' }}
        >
          {/* Section header */}
          <div
            className="px-6 py-4 border-b border-border"
            style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.08) 0%, transparent 100%)' }}
          >
            <h2 className="text-white font-bold text-lg">How to Sideload on Firestick</h2>
            <p className="text-muted-foreground text-sm mt-0.5">One-time setup — takes about 5 minutes</p>
          </div>

          <div className="p-6 space-y-0">
            {SIDELOAD_STEPS.map((step, idx) => (
              <div key={step.n} className="flex gap-4">
                {/* Step number + connector line */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                      boxShadow: '0 0 12px rgba(239,68,68,0.3)',
                    }}
                  >
                    {step.n}
                  </div>
                  {idx < SIDELOAD_STEPS.length - 1 && (
                    <div className="w-px flex-1 my-1" style={{ background: 'rgba(239,68,68,0.2)', minHeight: '24px' }} />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-6 min-w-0 ${idx === SIDELOAD_STEPS.length - 1 ? 'pb-0' : ''}`}>
                  <h3 className="text-white font-semibold text-sm mb-1">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ───────────────────────────────────────── */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 rounded-2xl border border-border"
          style={{ background: 'linear-gradient(135deg, #1a0a0a 0%, #0f0f0f 100%)' }}
        >
          <div>
            <p className="text-white font-semibold text-sm">Ready to stream?</p>
            <p className="text-muted-foreground text-xs mt-0.5">Activate your VPN first for full privacy protection.</p>
          </div>
          <Link
            href="/dashboard/vpn"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 0 20px rgba(34,197,94,0.25)' }}
          >
            <ShieldIcon />
            Activate Infinity VPN
          </Link>
        </div>

      </div>
    </div>
  );
}
