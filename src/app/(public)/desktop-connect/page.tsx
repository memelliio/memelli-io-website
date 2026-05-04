'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Download,
  Monitor,
  Terminal,
  Wifi,
  WifiOff,
  Zap,
  Shield,
  Globe,
  Eye,
  Sparkles,
  Bot,
  Apple,
  SmartphoneNfc,
} from 'lucide-react';

/* ======================================================================= */
/*  Types                                                                   */
/* ======================================================================= */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/* ======================================================================= */
/*  Constants                                                               */
/* ======================================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api-production-057c.up.railway.app';

/* ======================================================================= */
/*  Feature grid data                                                       */
/* ======================================================================= */

const FEATURES = [
  {
    icon: Shield,
    title: 'Private by Default',
    body: 'All traffic routes through your personal VPN tunnel. Your IP. Your identity.',
  },
  {
    icon: Eye,
    title: 'Zero Tracking',
    body: '50+ tracker domains blocked. No Google Analytics. No Facebook pixel. No fingerprinting.',
  },
  {
    icon: Sparkles,
    title: 'Melli OS Native',
    body: 'Save pages to Documents, contacts to CRM, leads to pipeline — directly from the browser.',
  },
  {
    icon: Globe,
    title: 'Your IP, Always',
    body: 'Platforms see your real residential IP. LinkedIn, Google, email tools — zero suspicious activity flags.',
  },
  {
    icon: Bot,
    title: 'Agent Mode',
    body: 'AI watches your workflows and learns to automate them. Prospect once, automate forever.',
  },
  {
    icon: Zap,
    title: 'Infinity Speed',
    body: 'Built on Chromium. Full extension support. Faster than Chrome because we stripped the surveillance.',
  },
];

/* ======================================================================= */
/*  Desktop Connect Page (Public)                                           */
/* ======================================================================= */

export default function DesktopConnectPublicPage() {
  // PWA install state
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installStatus, setInstallStatus] = useState<
    'available' | 'ios' | 'installed' | 'unsupported'
  >('unsupported');

  // Connection status
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'error'
  >('connecting');
  const [apiLatency, setApiLatency] = useState<number | null>(null);

  // Device detection + PWA install check
  useEffect(() => {
    // Check if already installed
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      setInstallStatus('installed');
      return;
    }

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS && isSafari) {
      setInstallStatus('ios');
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallStatus('available');
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Connection health check
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const start = Date.now();
        const res = await fetch(`${API_URL}/api/health`, {
          signal: AbortSignal.timeout(4000),
        });
        if (cancelled) return;
        const latency = Date.now() - start;
        setApiLatency(latency);
        setConnectionStatus(res.ok ? 'connected' : 'error');
      } catch {
        if (!cancelled) setConnectionStatus('error');
      }
    };
    check();
    const interval = setInterval(check, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // PWA install handler
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallStatus('installed');
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">

      {/* ----------------------------------------------------------------- */}
      {/* Connection status bar                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex justify-end px-6 pt-4">
        {connectionStatus === 'connected' ? (
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">
              Connected{apiLatency !== null ? ` · ${apiLatency}ms` : ''}
            </span>
          </div>
        ) : connectionStatus === 'connecting' ? (
          <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            <span className="text-xs font-medium text-amber-400">
              Connecting…
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5">
            <WifiOff className="h-3.5 w-3.5 text-red-400" />
            <span className="text-xs font-medium text-red-400">
              Disconnected
            </span>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Hero                                                               */}
      {/* ----------------------------------------------------------------- */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Infinity Browser
        </h1>
        <p className="mt-5 text-lg text-muted-foreground sm:text-xl">
          The private browser built for your business OS
        </p>

        {/* Feature pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {[
            'WireGuard VPN Built-in',
            'Ad & Tracker Blocking',
            'Melli OS Integrated',
          ].map((label) => (
            <span
              key={label}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#download"
            className="group inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-400"
          >
            <Apple className="h-4 w-4" />
            Download for Mac
          </a>
          <a
            href="#download"
            className="group inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-400"
          >
            <Monitor className="h-4 w-4" />
            Download for Windows
          </a>
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          Works on Mac, Windows, and Linux.
        </p>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Feature grid                                                       */}
      {/* ----------------------------------------------------------------- */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-muted p-6 transition-colors hover:border-white/10 hover:bg-white/[0.05]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <Icon className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Download section                                                   */}
      {/* ----------------------------------------------------------------- */}
      <section id="download" className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="mb-2 text-center text-2xl font-bold text-white">
          Get Infinity Browser
        </h2>
        <p className="mb-10 text-center text-sm text-muted-foreground">
          Connects automatically to Melli VPN on first launch
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Mac */}
          <div className="flex flex-col items-center rounded-2xl border border-border bg-muted p-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
              <Apple className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-white">Mac</p>
            <p className="mt-1 text-xs text-muted-foreground">macOS 12+ · ~85 MB</p>
            <a
              href="#"
              className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-foreground transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
            >
              Download
            </a>
          </div>

          {/* Windows */}
          <div className="flex flex-col items-center rounded-2xl border border-border bg-muted p-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
              <Monitor className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-white">Windows</p>
            <p className="mt-1 text-xs text-muted-foreground">Windows 10+ · ~90 MB</p>
            <a
              href="#"
              className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-foreground transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
            >
              Download
            </a>
          </div>

          {/* Linux */}
          <div className="flex flex-col items-center rounded-2xl border border-border bg-muted p-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
              <Terminal className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-white">Linux</p>
            <p className="mt-1 text-xs text-muted-foreground">.deb / .AppImage · ~88 MB</p>
            <a
              href="#"
              className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-foreground transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
            >
              Download
            </a>
          </div>

          {/* Install as App (PWA) */}
          <div className="flex flex-col items-center rounded-2xl border border-border bg-muted p-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
              <SmartphoneNfc className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-white">Install as App</p>
            <p className="mt-1 text-xs text-muted-foreground">PWA · any OS</p>

            {installStatus === 'installed' || isInstalled ? (
              <span className="mt-5 w-full rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2.5 text-xs font-semibold text-emerald-400">
                Installed
              </span>
            ) : installStatus === 'available' ? (
              <button
                onClick={handleInstall}
                className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-foreground transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
              >
                Install
              </button>
            ) : installStatus === 'ios' ? (
              <p className="mt-5 text-xs text-muted-foreground leading-relaxed">
                Safari → Share → Add to Home Screen
              </p>
            ) : (
              <p className="mt-5 text-xs text-muted-foreground leading-relaxed">
                Open in Chrome or Edge to install
              </p>
            )}
          </div>
        </div>

      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Bottom membership note                                             */}
      {/* ----------------------------------------------------------------- */}
      <section className="border-t border-border bg-white/[0.02] px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Included free with every{' '}
          <span className="font-semibold text-muted-foreground">Melli OS</span>{' '}
          membership.{' '}
          <a
            href="/"
            className="font-semibold text-red-500 transition hover:text-red-400"
          >
            Get Started →
          </a>
        </p>

        {/* System connection details */}
        <div className="mx-auto mt-6 max-w-xs rounded-xl border border-border bg-[#0f0f0f] px-4 py-3 text-left">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            System Connection
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">API</span>
              <span
                className={
                  connectionStatus === 'connected'
                    ? 'text-emerald-400'
                    : connectionStatus === 'connecting'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }
              >
                {connectionStatus === 'connected'
                  ? 'Online'
                  : connectionStatus === 'connecting'
                  ? 'Connecting…'
                  : 'Offline'}
              </span>
            </div>
            {apiLatency !== null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Latency</span>
                <span
                  className={
                    apiLatency < 200
                      ? 'text-emerald-400'
                      : apiLatency < 500
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }
                >
                  {apiLatency}ms
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Mode</span>
              <span className="text-muted-foreground">
                {typeof window !== 'undefined' &&
                window.matchMedia('(display-mode: standalone)').matches
                  ? 'Standalone App'
                  : 'Browser'}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
