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

export const { AuthProvider, useAuth } = createAuthContext({
  apiUrl: API_URL,
  storagePrefix: getStoragePrefix(),
});
