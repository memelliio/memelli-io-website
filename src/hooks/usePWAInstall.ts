'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  canInstallNatively,
  triggerNativeInstall,
  detectPWAPlatform,
  isInstalled,
  type PWAPlatform,
} from '../lib/pwa-install';

export interface PWAInstallState {
  /** True if native prompt is available (Chrome/Edge/Android/Samsung) */
  canInstall: boolean;
  /** Platform for showing correct instructions */
  platform: PWAPlatform;
  /** True if already running in standalone / installed mode */
  installed: boolean;
  /** Call this to trigger the install — returns outcome or 'unavailable' */
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

export function usePWAInstall(): PWAInstallState {
  const [canInstall, setCanInstall] = useState(false);
  const [platform, setPlatform] = useState<PWAPlatform>('other');
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isInstalled()) {
      setInstalled(true);
      return;
    }
    setPlatform(detectPWAPlatform());
    // Check immediately (prompt may already be stored from early-capture script)
    setCanInstall(canInstallNatively());

    // Also listen for the event in case it fires after hydration
    function onPrompt(e: Event) {
      e.preventDefault();
      (window as any).__pwaPrompt = e;
      setCanInstall(true);
    }
    window.addEventListener('beforeinstallprompt', onPrompt);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const install = useCallback(async () => {
    const result = await triggerNativeInstall();
    if (result === 'accepted') {
      setInstalled(true);
      setCanInstall(false);
    } else {
      // Prompt was consumed, re-check
      setCanInstall(canInstallNatively());
    }
    return result;
  }, []);

  return { canInstall, platform, installed, install };
}
