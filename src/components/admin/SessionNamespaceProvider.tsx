"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * SessionNamespaceProvider — Storage namespace isolation
 *
 * React context provider that determines the correct storage namespace
 * based on session type (internal, customer, whitelabel, impersonation).
 * All localStorage/sessionStorage access should go through this provider
 * to prevent cross-session data leakage.
 */

type SessionType = "INTERNAL" | "CUSTOMER" | "WHITELABEL" | "IMPERSONATION";

const NAMESPACE_PREFIX_MAP: Record<SessionType, string> = {
  INTERNAL: "memelli:internal:",
  CUSTOMER: "memelli:tenant:",
  WHITELABEL: "memelli:tenant:",
  IMPERSONATION: "memelli:impersonation:",
};

const COOKIE_NAME_MAP: Record<SessionType, string> = {
  INTERNAL: "mu_internal_session",
  CUSTOMER: "mu_customer_session",
  WHITELABEL: "mu_whitelabel_session",
  IMPERSONATION: "mu_impersonation_session",
};

const INTERNAL_ROLES = new Set([
  "SUPER_ADMIN",
  "PLATFORM_ADMIN",
  "MEMELLI_AGENT",
  "QA_TESTER",
  "DEV_ADMIN",
  "SUPPORT_ADMIN",
  "FRAUD_ADMIN",
  "FINANCE_ADMIN",
  "COMPLIANCE_ADMIN",
]);

const MEMELLI_CORE_HOSTS = new Set([
  "universe.memelli.com",
  "memelli.com",
  "www.memelli.com",
  "localhost",
]);

interface SessionNamespaceContextValue {
  /** Current session type */
  sessionType: SessionType;
  /** Get a storage key with the correct namespace prefix */
  getStorageKey: (key: string) => string;
  /** Get the correct cookie name for the current session type */
  getSessionCookieName: () => string;
  /** Get a value from namespaced localStorage */
  getItem: (key: string) => string | null;
  /** Set a value in namespaced localStorage */
  setItem: (key: string, value: string) => void;
  /** Remove a value from namespaced localStorage */
  removeItem: (key: string) => void;
  /** Clear all namespaced storage for the current session */
  clearNamespace: () => void;
}

const SessionNamespaceContext = createContext<SessionNamespaceContextValue | null>(null);

function detectSessionType(): SessionType {
  if (typeof window === "undefined") return "CUSTOMER";

  // Check user role from JWT
  try {
    const raw = localStorage.getItem("memelli_token");
    if (raw) {
      const parts = raw.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/")));
        if (INTERNAL_ROLES.has(payload.role)) {
          // Check for impersonation marker
          const impersonating = localStorage.getItem("memelli:impersonation:active");
          if (impersonating) return "IMPERSONATION";
          return "INTERNAL";
        }
      }
    }
  } catch {
    // Fall through
  }

  // Check domain
  const host = window.location.hostname.toLowerCase();
  if (MEMELLI_CORE_HOSTS.has(host)) return "CUSTOMER";
  return "WHITELABEL";
}

interface SessionNamespaceProviderProps {
  children: ReactNode;
}

export default function SessionNamespaceProvider({ children }: SessionNamespaceProviderProps) {
  const [sessionType, setSessionType] = useState<SessionType>("CUSTOMER");
  const [prevSessionType, setPrevSessionType] = useState<SessionType | null>(null);

  useEffect(() => {
    const detected = detectSessionType();
    setSessionType((prev) => {
      if (prev !== detected) {
        setPrevSessionType(prev);
      }
      return detected;
    });
  }, []);

  // Clear cached state on mode switch
  useEffect(() => {
    if (prevSessionType && prevSessionType !== sessionType) {
      // Clear the previous namespace's transient state
      const prevPrefix = NAMESPACE_PREFIX_MAP[prevSessionType];
      if (typeof window !== "undefined") {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(prevPrefix) && key.includes(":cache:")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
      setPrevSessionType(null);
    }
  }, [sessionType, prevSessionType]);

  const prefix = NAMESPACE_PREFIX_MAP[sessionType];

  const getStorageKey = useCallback(
    (key: string) => `${prefix}${key}`,
    [prefix],
  );

  const getSessionCookieName = useCallback(
    () => COOKIE_NAME_MAP[sessionType],
    [sessionType],
  );

  const getItem = useCallback(
    (key: string) => {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(`${prefix}${key}`);
    },
    [prefix],
  );

  const setItem = useCallback(
    (key: string, value: string) => {
      if (typeof window === "undefined") return;
      localStorage.setItem(`${prefix}${key}`, value);
    },
    [prefix],
  );

  const removeItem = useCallback(
    (key: string) => {
      if (typeof window === "undefined") return;
      localStorage.removeItem(`${prefix}${key}`);
    },
    [prefix],
  );

  const clearNamespace = useCallback(() => {
    if (typeof window === "undefined") return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }, [prefix]);

  const value = useMemo<SessionNamespaceContextValue>(
    () => ({
      sessionType,
      getStorageKey,
      getSessionCookieName,
      getItem,
      setItem,
      removeItem,
      clearNamespace,
    }),
    [sessionType, getStorageKey, getSessionCookieName, getItem, setItem, removeItem, clearNamespace],
  );

  return (
    <SessionNamespaceContext.Provider value={value}>
      {children}
    </SessionNamespaceContext.Provider>
  );
}

/**
 * Hook to access the session namespace context.
 * Must be used within a SessionNamespaceProvider.
 */
export function useSessionNamespace(): SessionNamespaceContextValue {
  const ctx = useContext(SessionNamespaceContext);
  if (!ctx) {
    throw new Error("useSessionNamespace must be used within a SessionNamespaceProvider");
  }
  return ctx;
}
