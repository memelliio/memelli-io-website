'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, X, Share, Monitor, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const DISMISS_KEY = 'memelli-install-dismissed';
const DISMISS_TTL = 48 * 60 * 60 * 1000; // 48 hours

function wasDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  try {
    const ts = JSON.parse(raw) as number;
    if (Date.now() - ts > DISMISS_TTL) { localStorage.removeItem(DISMISS_KEY); return false; }
    return true;
  } catch { return false; }
}

export function InstallAppBanner() {
  const { canInstall, platform, installed, install } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    if (installed || wasDismissed()) return;

    if (canInstall) {
      // Native prompt ready — show banner immediately
      setVisible(true);
      return;
    }

    // iOS Safari — no native prompt, show guide after delay
    if (platform === 'ios') {
      const t = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(t);
    }

    // Desktop without prompt yet — show after longer delay
    if (platform === 'desktop-chrome' || platform === 'desktop-edge') {
      const t = setTimeout(() => setVisible(true), 6000);
      return () => clearTimeout(t);
    }
  }, [canInstall, platform, installed]);

  const handleInstall = useCallback(async () => {
    if (canInstall) {
      const result = await install();
      if (result === 'accepted') { setVisible(false); return; }
    }
    // No native prompt — show guide
    setGuide(true);
  }, [canInstall, install]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setGuide(false);
    localStorage.setItem(DISMISS_KEY, JSON.stringify(Date.now()));
  }, []);

  if (!visible || installed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="pointer-events-auto mx-auto w-full max-w-lg px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/97 shadow-2xl shadow-black/50 backdrop-blur-xl">
          {/* Red accent top line */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-red-700 via-red-500 to-red-700" />

          <button
            onClick={handleDismiss}
            className="absolute right-2.5 top-2.5 z-10 rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="px-4 py-4">
            {guide ? (
              <InstallGuide platform={platform} onClose={() => setGuide(false)} />
            ) : (
              <div className="flex items-center gap-3 pr-7">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 border border-red-500/25">
                  <Download className="h-5 w-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-100">Install Memelli App</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500 leading-tight">
                    {platform === 'ios'
                      ? 'Add to your home screen for instant access'
                      : platform === 'android' || platform === 'samsung'
                        ? 'Install for offline & home screen access'
                        : 'Install as a desktop app for instant access'}
                  </p>
                </div>
                <button
                  onClick={handleInstall}
                  className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-red-500 active:scale-95 shadow-lg shadow-red-600/20"
                >
                  {canInstall ? 'Install' : platform === 'ios' ? 'How' : 'How'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InstallGuide({ platform, onClose }: { platform: string; onClose: () => void }) {
  if (platform === 'ios') {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-zinc-100">Install on iPhone / iPad</p>
        <div className="space-y-2">
          <Step n={1}>
            <span>Tap the</span>
            <Share className="h-3.5 w-3.5 text-blue-400 inline mx-1" />
            <span className="text-blue-400 font-medium">Share</span>
            <span> button in Safari</span>
          </Step>
          <Step n={2}><span>Scroll down and tap <span className="text-zinc-100 font-medium">&quot;Add to Home Screen&quot;</span></span></Step>
          <Step n={3}><span>Tap <span className="text-zinc-100 font-medium">&quot;Add&quot;</span> to confirm</span></Step>
        </div>
        <button onClick={onClose} className="text-[11px] text-zinc-500 hover:text-zinc-400 transition-colors mt-1">Got it</button>
      </div>
    );
  }

  if (platform === 'firefox') {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-zinc-100">Install on Firefox</p>
        <div className="space-y-2">
          <Step n={1}><span>Tap the <span className="text-zinc-100 font-medium">3-dot menu</span> (⋮) in Firefox</span></Step>
          <Step n={2}><span>Tap <span className="text-zinc-100 font-medium">&quot;Install&quot;</span> or <span className="text-zinc-100 font-medium">&quot;Add to Home Screen&quot;</span></span></Step>
          <Step n={3}><span>Tap <span className="text-zinc-100 font-medium">&quot;Add&quot;</span> to confirm</span></Step>
        </div>
        <button onClick={onClose} className="text-[11px] text-zinc-500 hover:text-zinc-400 transition-colors mt-1">Got it</button>
      </div>
    );
  }

  // Desktop Chrome / Edge / other
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Monitor className="h-4 w-4 text-red-400" />
        <p className="text-sm font-semibold text-zinc-100">Install on Desktop</p>
      </div>
      <div className="space-y-2">
        <Step n={1}><span>Look for the <span className="text-zinc-100 font-medium">install icon</span> (⊕) in the address bar (far right)</span></Step>
        <Step n={2}><span>Click it, then click <span className="text-zinc-100 font-medium">&quot;Install&quot;</span> in the popup</span></Step>
        <Step n={3}><span>Memelli opens as a standalone desktop app</span></Step>
      </div>
      <p className="text-[11px] text-zinc-600">Or open in Chrome / Edge if you&apos;re on another browser.</p>
      <button onClick={onClose} className="text-[11px] text-zinc-500 hover:text-zinc-400 transition-colors mt-1">Got it</button>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-zinc-800/50 px-3 py-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-400">
        {n}
      </span>
      <span className="text-xs text-zinc-300 flex items-center gap-1 flex-wrap">{children}</span>
    </div>
  );
}
