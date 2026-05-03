"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * InternalRouteGuard — Route protection for admin routes
 *
 * Wraps admin routes (/admin, /ops, /internal, /fraud, /finance, /compliance)
 * and checks role, IP allowlist status, and MFA status before rendering.
 * Supports soft mode (warning + step-up) and hard mode (full block).
 */

type InternalRole =
  | "ADMIN"
  | "SUPER_ADMIN"
  | "PLATFORM_ADMIN"
  | "MEMELLI_AGENT"
  | "QA_TESTER"
  | "DEV_ADMIN"
  | "SUPPORT_ADMIN"
  | "FRAUD_ADMIN"
  | "FINANCE_ADMIN"
  | "COMPLIANCE_ADMIN";

const INTERNAL_ROLES = new Set<string>([
  "ADMIN",
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

interface InternalRouteGuardProps {
  children: ReactNode;
  /** Required internal roles. If empty/omitted, any internal role works. */
  requiredRoles?: InternalRole[];
  /** Whether to check IP allowlist (default: false) */
  checkIP?: boolean;
  /** Whether to check MFA status (default: false) */
  checkMFA?: boolean;
  /** "soft" shows warning with step-up option, "hard" fully blocks (default: "hard") */
  mode?: "soft" | "hard";
}

type GuardState = "loading" | "allowed" | "blocked" | "warning";

interface BlockInfo {
  reason: string;
  details: string;
  canStepUp: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getUserFromToken(): { role: string; sub: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("memelli_token");
    if (!raw) return null;
    const parts = raw.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/")));
    return { role: payload.role, sub: payload.sub };
  } catch {
    return null;
  }
}

export default function InternalRouteGuard({
  children,
  requiredRoles = [],
  checkIP = false,
  checkMFA = false,
  mode = "hard",
}: InternalRouteGuardProps) {
  const [state, setState] = useState<GuardState>("loading");
  const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(null);

  useEffect(() => {
    async function evaluate() {
      const user = getUserFromToken();

      if (!user) {
        setBlockInfo({
          reason: "Authentication Required",
          details: "You must be logged in to access this area.",
          canStepUp: false,
        });
        setState("blocked");
        return;
      }

      // Check internal role
      if (!INTERNAL_ROLES.has(user.role)) {
        setBlockInfo({
          reason: "Insufficient Permissions",
          details: "This area is restricted to internal Memelli staff.",
          canStepUp: false,
        });
        setState("blocked");
        return;
      }

      // ADMIN/SUPER_ADMIN have full control and bypass secondary gate checks.
      if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        setState("allowed");
        return;
      }

      // Check specific role requirement
      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role as InternalRole)) {
        setBlockInfo({
          reason: "Role Not Authorized",
          details: `This area requires one of: ${requiredRoles.join(", ")}. Your role: ${user.role}.`,
          canStepUp: false,
        });
        setState(mode === "soft" ? "warning" : "blocked");
        return;
      }

      // Check IP allowlist if required
      if (checkIP) {
        try {
          const token = localStorage.getItem("memelli_token");
          const res = await fetch(`${API_URL}/api/admin/sessions/context`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.status === 403) {
            setBlockInfo({
              reason: "IP Not Allowed",
              details: "Your IP address is not in the allowlist for this area.",
              canStepUp: true,
            });
            setState(mode === "soft" ? "warning" : "blocked");
            return;
          }
        } catch {
          // If we can't check, allow through in soft mode
          if (mode === "hard") {
            setBlockInfo({
              reason: "Verification Failed",
              details: "Unable to verify your IP address. Try again later.",
              canStepUp: true,
            });
            setState("blocked");
            return;
          }
        }
      }

      // Check MFA if required (placeholder for future MFA implementation)
      if (checkMFA) {
        const hasMFA = localStorage.getItem("memelli:internal:mfa_verified") === "true";
        if (!hasMFA) {
          setBlockInfo({
            reason: "MFA Required",
            details: "This area requires multi-factor authentication. Please complete MFA verification.",
            canStepUp: true,
          });
          setState(mode === "soft" ? "warning" : "blocked");
          return;
        }
      }

      setState("allowed");
    }

    evaluate();
  }, [requiredRoles, checkIP, checkMFA, mode]);

  if (state === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (state === "blocked" && blockInfo) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-8">
        <div className="max-w-md rounded-xl border border-red-500/30 bg-gray-900 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>

          <h2 className="mb-2 text-xl font-bold text-red-400">
            {blockInfo.reason}
          </h2>

          <p className="mb-6 text-sm text-gray-400">
            {blockInfo.details}
          </p>

          {blockInfo.canStepUp && (
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 text-left">
              <p className="text-xs font-medium text-gray-300">Step-up authentication available</p>
              <p className="mt-1 text-xs text-gray-500">
                Contact a SUPER_ADMIN to grant access, or complete additional verification.
              </p>
            </div>
          )}

          <button
            onClick={() => window.history.back()}
            className="mt-6 rounded-lg bg-gray-700 px-6 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (state === "warning" && blockInfo) {
    return (
      <div>
        {/* Warning banner at top */}
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-900/20 p-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-400">{blockInfo.reason}</p>
              <p className="mt-1 text-xs text-gray-400">{blockInfo.details}</p>
              {blockInfo.canStepUp && (
                <p className="mt-2 text-xs text-amber-500/70">
                  Step-up authentication is available to gain full access.
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Render children in soft mode */}
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
