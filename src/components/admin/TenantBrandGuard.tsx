"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * TenantBrandGuard — Branding protection for internal users
 *
 * If the user is internal and NOT in preview/impersonation mode,
 * blocks customer branding and forces Memelli internal branding.
 * Shows an "Internal Admin View" badge.
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

interface TenantBrandGuardProps {
  children: ReactNode;
  /** Tenant branding that would normally be applied */
  tenantBranding?: {
    primaryColor?: string;
    logoUrl?: string;
    businessName?: string;
  } | null;
  /** True if the user is in explicit preview/impersonation mode */
  isPreviewMode?: boolean;
}

const MEMELLI_INTERNAL_BRANDING = {
  primaryColor: "#7C3AED",
  logoUrl: "https://memelli.com/logo.svg",
  businessName: "Memelli Command Center",
};

function getUserRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("memelli_token");
    if (!raw) return null;
    const parts = raw.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role || null;
  } catch {
    return null;
  }
}

export default function TenantBrandGuard({
  children,
  tenantBranding,
  isPreviewMode = false,
}: TenantBrandGuardProps) {
  const [isInternal, setIsInternal] = useState(false);
  const [shouldBlockBranding, setShouldBlockBranding] = useState(false);

  useEffect(() => {
    const role = getUserRole();
    if (!role) return;

    const internal = INTERNAL_ROLES.has(role);
    setIsInternal(internal);

    // Block customer branding for internal users unless in preview mode
    if (internal && !isPreviewMode && tenantBranding) {
      setShouldBlockBranding(true);
    } else {
      setShouldBlockBranding(false);
    }
  }, [isPreviewMode, tenantBranding]);

  // Apply internal branding overrides via CSS custom properties
  useEffect(() => {
    if (!shouldBlockBranding) return;

    const root = document.documentElement;
    const prevPrimary = root.style.getPropertyValue("--brand-primary");

    root.style.setProperty("--brand-primary", MEMELLI_INTERNAL_BRANDING.primaryColor);

    return () => {
      if (prevPrimary) {
        root.style.setProperty("--brand-primary", prevPrimary);
      } else {
        root.style.removeProperty("--brand-primary");
      }
    };
  }, [shouldBlockBranding]);

  return (
    <>
      {isInternal && (
        <div className="fixed bottom-4 right-4 z-[9998] flex items-center gap-2 rounded-full border border-red-500/30 bg-red-900/90 px-4 py-2 text-xs font-medium text-red-200 shadow-lg backdrop-blur-sm">
          <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          <span>Internal Admin View</span>
          {shouldBlockBranding && (
            <span className="ml-1 rounded bg-red-700/50 px-1.5 py-0.5 text-[10px] text-red-300">
              Customer branding blocked
            </span>
          )}
        </div>
      )}
      {children}
    </>
  );
}
