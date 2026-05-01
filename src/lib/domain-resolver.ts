/**
 * Frontend Domain Resolution Helper — Memelli Cockpit OS (Command Center)
 *
 * Resolves hostnames to portal configuration by calling the
 * public /api/resolve endpoint. Caches results in memory.
 * Used by layouts and middleware to determine portal mode + branding.
 */

import { API_URL } from "./config";

function deriveRootDomain(hostname: string): string {
  const normalized = hostname.toLowerCase().replace(/:\d+$/, "");
  if (!normalized || normalized === "localhost" || /^(\d{1,3}\.){3}\d{1,3}$/.test(normalized)) {
    return "";
  }

  const parts = normalized.split(".").filter(Boolean);
  if (parts.length < 2) {
    return normalized;
  }

  return parts.slice(-2).join(".");
}

function getPlatformRootDomain(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return deriveRootDomain(window.location.hostname);
}

// ── Types ─────────────────────────────────────────────────────────────

export type PortalModeType = "lite" | "pro" | "internal";

export interface PortalBranding {
  businessName: string;
  tagline?: string;
  logoUrl?: string;
  logoIconUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  headingFont?: string;
  bodyFont?: string;
}

export interface PortalConfig {
  portalMode: PortalModeType;
  partnerId: string | null;
  tenantId: string | null;
  organizationName: string | null;
  branding: PortalBranding;
  isPartnerPortal: boolean;
  isCustomDomain: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────

const MEMELLI_DOMAINS = ["localhost"];

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const DEFAULT_BRANDING: PortalBranding = {
  businessName: "Memelli Command Center",
  tagline: "The Operating System for Business",
  logoUrl: "/logo.svg",
  primaryColor: "#7C3AED",
};

const DEFAULT_CONFIG: PortalConfig = {
  portalMode: "internal",
  partnerId: null,
  tenantId: null,
  organizationName: "Memelli Command Center",
  branding: DEFAULT_BRANDING,
  isPartnerPortal: false,
  isCustomDomain: false,
};

// ── In-memory cache ───────────────────────────────────────────────────

const cache = new Map<string, { config: PortalConfig; expiresAt: number }>();

// ── Helpers ───────────────────────────────────────────────────────────

function mapPortalMode(mode: string): PortalModeType {
  switch (mode) {
    case "INFINITY_LITE":
      return "lite";
    case "INFINITY_PRO":
      return "pro";
    case "UNIVERSE_INTERNAL": // legacy enum value — = cockpit/Command Center, see CLAUDE.md
    default:
      return "internal";
  }
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Resolve a hostname to full portal configuration.
 * Calls the API /resolve endpoint and caches the result.
 */
export async function getPortalConfig(hostname: string): Promise<PortalConfig> {
  const normalized = hostname.toLowerCase().replace(/:\d+$/, "");

  // Check cache
  const cached = cache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.config;
  }

  try {
    const res = await fetch(
      `${API_URL}/api/resolve?domain=${encodeURIComponent(normalized)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        next: { revalidate: 300 },
      } as any,
    );

    if (!res.ok) {
      return DEFAULT_CONFIG;
    }

    const data = await res.json();

    const config: PortalConfig = {
      portalMode: mapPortalMode(data.portalMode),
      partnerId: data.partnerId || null,
      tenantId: data.tenantId || null,
      organizationName: data.organizationName || null,
      branding: data.branding || DEFAULT_BRANDING,
      isPartnerPortal: !!data.isPartnerPortal,
      isCustomDomain: !!data.isCustomDomain,
    };

    // Cache result
    cache.set(normalized, {
      config,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return config;
  } catch {
    // Network error — return defaults
    return DEFAULT_CONFIG;
  }
}

/**
 * Check if hostname is part of the current platform root domain.
 */
export function isMemelliDomain(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/:\d+$/, "");
  const platformRootDomain = getPlatformRootDomain();
  return (
    MEMELLI_DOMAINS.includes(normalized) ||
    (platformRootDomain !== "" &&
      (normalized === platformRootDomain || normalized.endsWith(`.${platformRootDomain}`)))
  );
}

/**
 * Check if hostname is a custom (non-memelli) domain.
 */
export function isCustomDomain(hostname: string): boolean {
  return !isMemelliDomain(hostname);
}

/**
 * Get the portal mode for a hostname.
 */
export async function getPortalMode(hostname: string): Promise<PortalModeType> {
  const config = await getPortalConfig(hostname);
  return config.portalMode;
}

/**
 * Get partner branding for a hostname, or default Memelli branding.
 */
export async function getBranding(hostname: string): Promise<PortalBranding> {
  const config = await getPortalConfig(hostname);
  return config.branding;
}
