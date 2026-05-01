'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  createElement,
} from 'react';
import type { AuthUser } from '@memelli/types';
import type { ReactNode } from 'react';

// ─── Constants ───────────────────────────────────────────────────────────────

const TOKEN_KEY = 'memelli_token';
const REMEMBER_ME_KEY = 'memelli_remember_me';
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const INACTIVITY_WARNING_MS = 1 * 60 * 1000;  // 1 minute warning before logout

function deriveRootDomain(hostname: string): string {
  const normalized = hostname.toLowerCase().replace(/:\d+$/, '');
  if (!normalized || normalized === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(normalized)) {
    return '';
  }

  const parts = normalized.split('.').filter(Boolean);
  if (parts.length < 2) {
    return normalized;
  }

  return parts.slice(-2).join('.');
}

export function resolveClientApiUrl(explicitUrl?: string): string {
  if (explicitUrl && explicitUrl.trim()) {
    return explicitUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const { protocol, hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }

  const rootDomain = deriveRootDomain(hostname);
  return rootDomain ? `${protocol}//api.${rootDomain}` : '';
}

/** Build the storage key, optionally namespaced by prefix (e.g. 'live' → 'memelli_live_token') */
function tokenKey(prefix?: string): string {
  return prefix ? `memelli_${prefix}_token` : TOKEN_KEY;
}

function rememberMeKey(prefix?: string): string {
  return prefix ? `memelli_${prefix}_remember_me` : REMEMBER_ME_KEY;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  showInactivityWarning: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  dismissInactivityWarning: () => void;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    tenantName: string,
    tenantSlug?: string
  ) => Promise<void>;
}

export interface AuthConfig {
  /** Base API URL, e.g. "https://api.memelli.com" */
  apiUrl: string;
  /** Optional app identifier for tracking/logging */
  appName?: string;
  /** Optional storage prefix so different environments don't collide (e.g. 'live', 'dev') */
  storagePrefix?: string;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Creates an auth context + provider + hook scoped to a specific API URL.
 *
 * Usage in each app:
 * ```ts
 * // src/contexts/auth.ts
 * import { createAuthContext, resolveClientApiUrl } from '@memelli/auth/client';
 * export const { AuthProvider, useAuth } = createAuthContext({
 *   apiUrl: resolveClientApiUrl(process.env.NEXT_PUBLIC_API_URL),
 * });
 * ```
 */
export function createAuthContext(config: AuthConfig) {
  const Context = createContext<AuthContextValue | null>(null);
  const key = tokenKey(config.storagePrefix);

  function AuthProvider({ children }: { children: ReactNode }) {
    // Instantly read token from localStorage on first render — no waiting
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(() => {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(key);
    });
    // If we already have a token in localStorage, don't block rendering.
    // isLoading only gates the initial "do we have a token at all?" check.
    // Background validation will clear the token if it's invalid.
    const [isLoading, setIsLoading] = useState(() => {
      if (typeof window === 'undefined') return true;
      // If token exists, render immediately — validate in background
      return !localStorage.getItem(key);
    });
    const [showInactivityWarning, setShowInactivityWarning] = useState(false);
    const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rmKey = rememberMeKey(config.storagePrefix);

    const clearInactivityTimers = useCallback(() => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      inactivityTimerRef.current = null;
      warningTimerRef.current = null;
      setShowInactivityWarning(false);
    }, []);

    const performLogout = useCallback(() => {
      clearInactivityTimers();
      localStorage.removeItem(key);
      localStorage.removeItem(rmKey);
      setToken(null);
      setUser(null);
    }, [clearInactivityTimers, rmKey]);

    const resetInactivityTimer = useCallback(() => {
      // Only run inactivity timer when user is logged in and NOT using "remember me"
      if (typeof window === 'undefined') return;
      const isRemembered = localStorage.getItem(rmKey) === 'true';
      if (isRemembered) return;

      clearInactivityTimers();

      // Show warning after INACTIVITY_TIMEOUT_MS
      inactivityTimerRef.current = setTimeout(() => {
        setShowInactivityWarning(true);
        // Auto-logout after INACTIVITY_WARNING_MS more
        warningTimerRef.current = setTimeout(() => {
          performLogout();
        }, INACTIVITY_WARNING_MS);
      }, INACTIVITY_TIMEOUT_MS);
    }, [clearInactivityTimers, performLogout, rmKey]);

    const dismissInactivityWarning = useCallback(() => {
      setShowInactivityWarning(false);
      resetInactivityTimer();
    }, [resetInactivityTimer]);

    // Set up activity listeners when user is logged in
    useEffect(() => {
      if (!token || !user) return;

      const handleActivity = () => resetInactivityTimer();
      const events = ['click', 'scroll', 'keypress', 'mousemove', 'touchstart'];
      events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
      resetInactivityTimer();

      return () => {
        events.forEach((evt) => window.removeEventListener(evt, handleActivity));
        clearInactivityTimers();
      };
    }, [token, user, resetInactivityTimer, clearInactivityTimers]);

    const validateToken = useCallback(async (storedToken: string) => {
      try {
        const res = await fetch(`${config.apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (res.ok) {
          const json = await res.json() as Record<string, unknown>;
          // API wraps response in { success, data }
          const userData = (json.data ?? json) as AuthUser;
          setUser(userData);
          setToken(storedToken);
        } else {
          // Token is invalid — clear everything and redirect to login
          localStorage.removeItem(key);
          localStorage.removeItem(rmKey);
          setToken(null);
          setUser(null);
        }
      } catch {
        // Network error — don't clear token, user might be offline
        // Keep the optimistic state
      } finally {
        setIsLoading(false);
      }
    }, [rmKey]);

    useEffect(() => {
      const stored = localStorage.getItem(key);
      if (stored) {
        // Token already set synchronously in useState initializer.
        // Validate in background — don't block rendering.
        validateToken(stored);
      } else {
        setIsLoading(false);
      }
    }, [validateToken]);

    const login = async (email: string, password: string, rememberMe?: boolean) => {
      const normalizedEmail = email.toLowerCase().trim();
      const res = await fetch(`${config.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password, rememberMe: !!rememberMe }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        // API returns { success, error } on failure
        const errMsg = (err.error ?? err.message ?? 'Login failed') as string;
        throw new Error(errMsg);
      }
      const json = (await res.json()) as Record<string, unknown>;
      // API wraps response in { success, data: { token, user, tenant } }
      const payload = (json.data ?? json) as Record<string, unknown>;
      const newToken = (payload.token ?? json.token ?? json.access_token) as string;
      if (!newToken) throw new Error('No token received');
      localStorage.setItem(key, newToken);
      if (rememberMe) {
        localStorage.setItem(rmKey, 'true');
      } else {
        localStorage.removeItem(rmKey);
      }
      setToken(newToken);
      setUser((payload.user ?? payload) as AuthUser);
    };

    const logout = performLogout;

    const register = async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
      tenantName: string,
      tenantSlug?: string
    ) => {
      const slug = tenantSlug || tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const res = await fetch(`${config.apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName, tenantName, tenantSlug: slug }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        const errMsg = (err.error ?? err.message ?? 'Registration failed') as string;
        throw new Error(errMsg);
      }
      const json = (await res.json()) as Record<string, unknown>;
      // API wraps response in { success, data: { token, user, tenant } }
      const payload = (json.data ?? json) as Record<string, unknown>;
      const newToken = (payload.token ?? json.token ?? json.access_token) as string;
      if (!newToken) throw new Error('No token received');
      localStorage.setItem(key, newToken);
      setToken(newToken);
      setUser((payload.user ?? payload) as AuthUser);
    };

    return createElement(
      Context.Provider,
      { value: { user, token, isLoading, showInactivityWarning, login, logout, dismissInactivityWarning, register } },
      children
    );
  }

  function useAuth(): AuthContextValue {
    const ctx = useContext(Context);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
  }

  return { AuthProvider, useAuth, AuthContext: Context };
}

// ─── Standalone helpers ──────────────────────────────────────────────────────

/** Read the shared token from localStorage (safe to call anywhere client-side) */
export function getStoredToken(prefix?: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(tokenKey(prefix));
}

/** Remove the shared token (logs out across all apps on same domain) */
export function clearStoredToken(prefix?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(tokenKey(prefix));
}

/** Store a token (used by non-React auth flows) */
export function setStoredToken(token: string, prefix?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(tokenKey(prefix), token);
}

export { TOKEN_KEY };
