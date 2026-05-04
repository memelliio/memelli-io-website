'use client';

import { createAuthContext } from '@memelli/auth/client';
import { API_URL } from '@/lib/config';

/** Detect storage prefix from hostname so live and dev tokens don't collide */
function getStoragePrefix(): string {
  if (typeof window === 'undefined') return 'dev';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('dev.')) {
    return 'dev';
  }
  if (host.startsWith('pro.')) {
    return 'pro';
  }
  return 'live';
}

function resolveAuthApiUrl(): string {
  // On the browser, use a relative path so /api/auth/* hits the Next.js
  // proxy in apps/web/src/app/api/auth/*. The proxy forwards to the live
  // working auth backend (design.memelli.io/admin/auth/*), bypassing the
  // gateway 404 on api.memelli.io/api/auth/*.
  if (typeof window !== "undefined") return "";
  return API_URL;
}

export const { AuthProvider, useAuth } = createAuthContext({
  apiUrl: resolveAuthApiUrl(),
  storagePrefix: getStoragePrefix(),
});
