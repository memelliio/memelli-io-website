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
// Inactivity timer kept for callers that opt into rememberMe=false. SignInTab
// on memelli.io currently hard-codes rememberMe=true so this never fires there.
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const INACTIVITY_WARNING_MS = 1 * 60 * 1000;  // 1 minute warning before logout

// Cross-tab + cross-component auth state event. SignUp.tsx fires this after
// /api/auth/verify-phone returns a token; AuthProvider listens and refreshes.
const AUTH_STATE_EVENT = 'memelli:auth-state';

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
  /** Server-side `recovered` flag from /api/auth/login — true when an account was restored from soft-delete. */
  recovered: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  dismissInactivityWarning: () => void;
  /** Clears the `recovered` flag once the consumer has shown its UI. */
  acknowledgeRecovered: () => void;
  /**
   * Two-step signup: posts to /api/auth/signup, returns { userId, devCode }.
   * Caller follows up with verifyPhone(userId, code) to receive the token.
   * The legacy single-step register() shape that posted to /api/auth/register
   * is removed because the gateway no longer serves that route in the same shape.
   */
  signup: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
  ) => Promise<{ userId: string; devCode?: string }>;
  /** Verifies the phone code; on success stores the token + user in context. */
  verifyPhone: (userId: string, code: string) => Promise<void>;
  /**
   * Legacy single-step register. Kept for backward-compat with apps that
   * still import this shape from @memelli/auth/client. Internally delegates
   * to `signup()` (which posts to /api/auth/signup) and throws a verification-
   * required error so callers know to follow up with `verifyPhone()`.
   * Phone is required by the new flow; pass it via the `tenantName` arg slot
   * for back-compat (the shape is otherwise identical).
   * @deprecated Use signup() + verifyPhone() instead.
   */
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneOrTenantName: string,
    _tenantSlug?: string,
  ) => Promise<{ userId: string; devCode?: string }>;
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
    const [recovered, setRecovered] = useState(false);
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
      setRecovered(false);
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

    const acknowledgeRecovered = useCallback(() => setRecovered(false), []);

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

    // Listen for cross-component auth events fired by SignUp.tsx (verify-phone
    // success) and cross-tab `storage` events. Without this, a successful
    // signup-verify writes the token to localStorage but the React state in
    // every other component shows logged-out until page reload.
    useEffect(() => {
      if (typeof window === 'undefined') return;
      const onAuthState = (e: Event) => {
        const detail = (e as CustomEvent<{ authenticated?: boolean }>).detail;
        const stored = localStorage.getItem(key);
        if (detail?.authenticated && stored) {
          validateToken(stored);
        } else if (detail?.authenticated === false) {
          performLogout();
        }
      };
      const onStorage = (e: StorageEvent) => {
        if (e.key !== key) return;
        if (e.newValue) {
          validateToken(e.newValue);
        } else {
          setToken(null);
          setUser(null);
        }
      };
      window.addEventListener(AUTH_STATE_EVENT, onAuthState as EventListener);
      window.addEventListener('storage', onStorage);
      return () => {
        window.removeEventListener(AUTH_STATE_EVENT, onAuthState as EventListener);
        window.removeEventListener('storage', onStorage);
      };
    }, [validateToken, performLogout]);

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
      // API wraps response in { success, data: { token, user, tenant, recovered } }
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
      setRecovered(Boolean(payload.recovered));
    };

    const logout = performLogout;

    const signup = async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
      phone: string,
    ): Promise<{ userId: string; devCode?: string }> => {
      const phoneDigits = phone.replace(/\D/g, '');
      const phoneE164 = phoneDigits.length === 10 ? `+1${phoneDigits}` : `+${phoneDigits}`;
      const res = await fetch(`${config.apiUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phoneE164,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        const errMsg = (err.error ?? err.message ?? 'Signup failed') as string;
        throw new Error(errMsg);
      }
      const json = (await res.json()) as Record<string, unknown>;
      const data = (json.data ?? json) as Record<string, unknown>;
      const userId = (data.userId ?? json.userId) as string;
      if (!userId) throw new Error('Signup succeeded but no userId returned');
      return { userId, devCode: (data.devCode ?? json.devCode) as string | undefined };
    };

    const verifyPhone = async (userId: string, code: string): Promise<void> => {
      const res = await fetch(`${config.apiUrl}/api/auth/verify-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        const errMsg = (err.error ?? err.message ?? 'Verification failed') as string;
        throw new Error(errMsg);
      }
      const json = (await res.json()) as Record<string, unknown>;
      const payload = (json.data ?? json) as Record<string, unknown>;
      const newToken = (payload.token ?? json.token ?? json.access_token) as string;
      if (!newToken) throw new Error('No token received');
      localStorage.setItem(key, newToken);
      // Newly-signed-up users get the same persistent-session UX as login
      localStorage.setItem(rmKey, 'true');
      setToken(newToken);
      setUser((payload.user ?? payload) as AuthUser);
    };

    const register = async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
      phoneOrTenantName: string,
      _tenantSlug?: string,
    ): Promise<{ userId: string; devCode?: string }> => {
      // Legacy shim — delegate to the new two-step signup flow. The 5th arg
      // is treated as a phone number when it looks like one (digits + +);
      // otherwise the gateway will return a 400 and the caller learns the
      // shape changed.
      const looksLikePhone = /^[\d +()\-.]+$/.test(phoneOrTenantName);
      const phone = looksLikePhone ? phoneOrTenantName : '';
      return signup(email, password, firstName, lastName, phone);
    };

    return createElement(
      Context.Provider,
      {
        value: {
          user,
          token,
          isLoading,
          showInactivityWarning,
          recovered,
          login,
          logout,
          dismissInactivityWarning,
          acknowledgeRecovered,
          signup,
          verifyPhone,
          register,
        },
      },
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

export { TOKEN_KEY, AUTH_STATE_EVENT };
