'use client';

import { useMemo } from 'react';
import { API_URL } from './config';

type EnvironmentMode = 'production' | 'development';

interface EnvironmentBadge {
  label: string;
  color: string;
}

interface ResolvedEnvironment {
  mode: EnvironmentMode;
  apiUrl: string;
  hostname: string;
  badge: EnvironmentBadge;
}

// ---------------------------------------------------------------------------
// 1. Detect environment mode from hostname
// ---------------------------------------------------------------------------

function detectMode(): { mode: EnvironmentMode; hostname: string } {
  const hostname =
    typeof window !== 'undefined' ? window.location.hostname : '';

  const isDev =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('dev.');

  return { mode: isDev ? 'development' : 'production', hostname };
}

// ---------------------------------------------------------------------------
// 2. Resolve API base URL
// ---------------------------------------------------------------------------

function resolveApiUrl(mode: EnvironmentMode): string {
  if (mode === 'development') {
    return 'http://localhost:3001';
  }
  return API_URL;
}

// ---------------------------------------------------------------------------
// 3. Namespaced storage key helpers
// ---------------------------------------------------------------------------

function prefix(mode: EnvironmentMode): string {
  return mode === 'production' ? 'memelli_live' : 'memelli_dev';
}

export function getStorageKey(key: string): string {
  const { mode } = detectMode();
  return `${prefix(mode)}_${key}`;
}

export function getTokenKey(): string {
  return getStorageKey('token');
}

export function getStateKey(scope: string): string {
  return getStorageKey(`state_${scope}`);
}

// ---------------------------------------------------------------------------
// 4. resolveEnvironment()
// ---------------------------------------------------------------------------

export function resolveEnvironment(): ResolvedEnvironment {
  const { mode, hostname } = detectMode();
  const apiUrl = resolveApiUrl(mode);

  const badge: EnvironmentBadge =
    mode === 'production'
      ? { label: 'LIVE', color: 'red' }
      : { label: 'DEV', color: 'yellow' };

  return { mode, apiUrl, hostname, badge };
}

// ---------------------------------------------------------------------------
// 5. React hook — memoised
// ---------------------------------------------------------------------------

export function useEnvironment(): ResolvedEnvironment {
  return useMemo(() => resolveEnvironment(), []);
}
