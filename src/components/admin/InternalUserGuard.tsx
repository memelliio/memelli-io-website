"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * InternalUserGuard — React guard component
 *
 * Checks if the authenticated user has an internal role. If an internal
 * user is on a custom domain, shows a redirect warning and auto-redirects
 * to the internal shell at universe.memelli.com (legacy subdomain for the
 * cockpit / Command Center — see CLAUDE.md naming note 2026-04-30).
 */

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

interface InternalUserGuardProps {
  children: ReactNode;
  allowPreview?: boolean;
}

interface UserSession {
  role: string;
  sub: string;
}

function getUserFromStorage(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("memelli_token");
    if (!raw) return null;
    // Decode JWT payload (base64url)
    const parts = raw.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/")));
    return { role: payload.role, sub: payload.sub };
  } catch {
    return null;
  }
}

function isInternalUser(role: string): boolean {
  return INTERNAL_ROLES.has(role);
}

function isCoreHost(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname.toLowerCase();
  return MEMELLI_CORE_HOSTS.has(host);
}

export default function InternalUserGuard({ children, allowPreview = false }: InternalUserGuardProps) {
  const [state, setState] = useState<"loading" | "allowed" | "redirecting">("loading");
  const [redirectUrl, setRedirectUrl] = useState<string>("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const user = getUserFromStorage();

    if (!user || !isInternalUser(user.role)) {
      // Not an internal user — pass through
      setState("allowed");
      return;
    }

    if (isCoreHost()) {
      // Internal user on core domain — allowed
      setState("allowed");
      return;
    }

    if (allowPreview) {
      // Preview mode enabled — allow through with warning
      setState("allowed");
      return;
    }

    // Internal user on custom domain — redirect
    const tenant = encodeURIComponent(window.location.hostname);
    const returnPath = encodeURIComponent(window.location.pathname + window.location.search);
    const url = `https://universe.memelli.com/admin/tenant-preview?tenant=${tenant}&returnPath=${returnPath}`;
    setRedirectUrl(url);
    setState("redirecting");
  }, [allowPreview]);

  // Countdown timer for redirect
  useEffect(() => {
    if (state !== "redirecting") return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = redirectUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state, redirectUrl]);

  if (state === "loading") {
    return null;
  }

  if (state === "redirecting") {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/95 backdrop-blur-sm">
        <div className="mx-4 max-w-lg rounded-xl border border-amber-500/30 bg-gray-800 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
            <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          <h2 className="mb-2 text-xl font-bold text-amber-400">
            Internal User Detected
          </h2>

          <p className="mb-4 text-sm text-gray-300">
            You are an internal Memelli staff member accessing a customer domain.
            For security and session isolation, you will be redirected to the
            internal admin shell.
          </p>

          <div className="mb-4 rounded-lg bg-gray-900/50 p-3 text-left">
            <p className="text-xs text-gray-400">Current domain</p>
            <p className="font-mono text-sm text-gray-200">
              {typeof window !== "undefined" ? window.location.hostname : ""}
            </p>
          </div>

          <p className="mb-6 text-sm text-gray-400">
            Redirecting in <span className="font-bold text-amber-400">{countdown}</span> seconds...
          </p>

          <div className="flex gap-3">
            <a
              href={redirectUrl}
              className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-amber-400 transition-colors"
            >
              Redirect Now
            </a>
            <button
              onClick={() => setState("allowed")}
              className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
            >
              Stay (Preview Mode)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
