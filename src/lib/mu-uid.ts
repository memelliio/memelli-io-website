/**
 * MU_UID Frontend Helper — Client-side identity management
 *
 * Manages the MU_UID (Memelli Universal User ID) on the frontend.
 * Reads/writes to cookie, localStorage, and sessionStorage for
 * maximum persistence. Supports cross-domain handoff.
 *
 * MU_UID Format: mu_<16 char random hex>
 */

// ─── Constants ──────────────────────────────────────────────────────────────

const COOKIE_NAME = "memelli_uid";
const STORAGE_KEY = "memelli_uid";
const MAX_AGE_SECONDS = 63072000; // 2 years

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TrackingPayload {
  muUid: string;
  eventType: string;
  host: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// ─── Cookie Helpers ─────────────────────────────────────────────────────────

/**
 * Read a cookie value by name from document.cookie.
 */
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const eqIdx = cookie.indexOf("=");
    if (eqIdx === -1) continue;
    const key = cookie.substring(0, eqIdx).trim();
    const value = cookie.substring(eqIdx + 1).trim();
    if (key === name) {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  return null;
}

/**
 * Write a cookie value. Not HttpOnly since frontend needs read access
 * for cross-domain operations.
 */
function writeCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === "undefined") return;

  let cookieStr = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;

  // Add Secure flag if on HTTPS
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    cookieStr += "; Secure";
  }

  document.cookie = cookieStr;
}

/**
 * Delete a cookie by setting max-age to 0.
 */
function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

// ─── Storage Helpers ────────────────────────────────────────────────────────

function readLocalStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full or blocked — ignore
  }
}

function removeLocalStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

function readSessionStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Storage full or blocked — ignore
  }
}

function removeSessionStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

// ─── Core MU_UID Functions ──────────────────────────────────────────────────

/**
 * Generate a new MU_UID on the client side.
 * Uses crypto.getRandomValues for secure random generation.
 */
export function generateMuUid(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `mu_${hex}`;
  }

  // Fallback for environments without crypto.getRandomValues
  const hex = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
  return `mu_${hex}`;
}

/**
 * Read MU_UID from cookie, then localStorage, then sessionStorage.
 * Returns the first one found, or null if none exist.
 */
export function getMuUid(): string | null {
  // 1. Cookie (highest priority — set by server)
  const fromCookie = readCookie(COOKIE_NAME);
  if (fromCookie) return fromCookie;

  // 2. localStorage (persists across sessions)
  const fromLocal = readLocalStorage(STORAGE_KEY);
  if (fromLocal) return fromLocal;

  // 3. sessionStorage (current tab only)
  const fromSession = readSessionStorage(STORAGE_KEY);
  if (fromSession) return fromSession;

  return null;
}

/**
 * Write MU_UID to cookie + localStorage + sessionStorage.
 */
export function setMuUid(muUid: string): void {
  writeCookie(COOKIE_NAME, muUid, MAX_AGE_SECONDS);
  writeLocalStorage(STORAGE_KEY, muUid);
  writeSessionStorage(STORAGE_KEY, muUid);
}

/**
 * Ensure a MU_UID exists. If none found in any storage,
 * generate a new one and persist it everywhere.
 */
export function ensureMuUid(): string {
  const existing = getMuUid();
  if (existing) return existing;

  const newUid = generateMuUid();
  setMuUid(newUid);
  return newUid;
}

/**
 * Remove MU_UID from all storage locations (for GDPR delete).
 */
export function clearMuUid(): void {
  deleteCookie(COOKIE_NAME);
  removeLocalStorage(STORAGE_KEY);
  removeSessionStorage(STORAGE_KEY);
}

// ─── Cross-Domain Handoff ───────────────────────────────────────────────────

/**
 * Append ?mu_uid=xxx to a target URL for cross-domain identity handoff.
 * If the URL already has a mu_uid param, it will be replaced.
 */
export function getCrossDomainUrl(targetUrl: string): string {
  const muUid = getMuUid();
  if (!muUid) return targetUrl;

  try {
    const url = new URL(targetUrl);
    url.searchParams.set("mu_uid", muUid);
    return url.toString();
  } catch {
    // If URL parsing fails, append manually
    const separator = targetUrl.includes("?") ? "&" : "?";
    return `${targetUrl}${separator}mu_uid=${encodeURIComponent(muUid)}`;
  }
}

/**
 * Check the current URL for a ?mu_uid= param. If found, set it locally
 * and clean the URL (remove the param without reloading the page).
 */
export function handleIncomingHandoff(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const url = new URL(window.location.href);
    const incomingUid = url.searchParams.get("mu_uid");

    if (!incomingUid) return null;

    // Set the incoming MU_UID locally
    setMuUid(incomingUid);

    // Clean the URL — remove mu_uid param without page reload
    url.searchParams.delete("mu_uid");
    const cleanUrl = url.toString();

    if (typeof window.history !== "undefined" && window.history.replaceState) {
      window.history.replaceState({}, "", cleanUrl);
    }

    return incomingUid;
  } catch {
    return null;
  }
}

// ─── Tracking Payload ───────────────────────────────────────────────────────

/**
 * Build a tracking payload ready to send to the API.
 */
export function getTrackingPayload(
  eventType: string,
  metadata?: Record<string, unknown>
): TrackingPayload {
  const muUid = ensureMuUid();

  return {
    muUid,
    eventType,
    host: typeof window !== "undefined" ? window.location.host : "unknown",
    timestamp: Date.now(),
    metadata,
  };
}
