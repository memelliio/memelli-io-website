/**
 * PWA Install — singleton that reads the globally captured beforeinstallprompt.
 * The event is captured by an inline <script> in layout.tsx before React hydrates.
 */

export type PWAPlatform =
  | 'ios'
  | 'android'
  | 'samsung'
  | 'desktop-chrome'
  | 'desktop-edge'
  | 'firefox'
  | 'other';

declare global {
  interface Window {
    __pwaPrompt: any;
  }
}

export function detectPWAPlatform(): PWAPlatform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/SamsungBrowser/i.test(ua)) return 'samsung';
  if (/Android/i.test(ua)) return 'android';
  if (/Edg\//i.test(ua)) return 'desktop-edge';
  if (/Chrome/i.test(ua) && !/OPR|Brave/i.test(ua)) return 'desktop-chrome';
  if (/Firefox/i.test(ua)) return 'firefox';
  return 'other';
}

export function isInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if ((navigator as any).standalone === true) return true;
  return false;
}

export function canInstallNatively(): boolean {
  if (typeof window === 'undefined') return false;
  return window.__pwaPrompt !== null && window.__pwaPrompt !== undefined;
}

export async function triggerNativeInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!canInstallNatively()) return 'unavailable';
  const prompt = window.__pwaPrompt;
  window.__pwaPrompt = null;
  prompt.prompt();
  const { outcome } = await prompt.userChoice;
  return outcome as 'accepted' | 'dismissed';
}
