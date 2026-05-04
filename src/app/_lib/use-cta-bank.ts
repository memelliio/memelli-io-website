"use client";

import { useEffect, useState } from "react";

export interface CtaBank {
  signupPrimary: string;
  signupSecondary: string;
  openCRM: string;
  openWorkspace: string;
  learnMore: string;
  contactSales: string;
}

/**
 * Fallback values used when the API cannot be reached or returns incomplete data.
 */
export const FALLBACK_CTA: CtaBank = {
  signupPrimary: "Sign up free",
  signupSecondary: "Get started",
  openCRM: "Open CRM",
  openWorkspace: "Open Workspace",
  learnMore: "Learn more",
  contactSales: "Contact sales",
};

/* -------------------------------------------------------------------------- */
/*                     Simple in‑memory 60‑second cache                     */
/* -------------------------------------------------------------------------- */
let cachedCta: CtaBank | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Hook that fetches CTA labels from `/api/os-node/os-config-cta-bank`.
 * It returns the fetched values, falling back to `FALLBACK_CTA` when needed.
 *
 * The result is cached for 60 seconds across component mounts.
 */
export function useCtaBank(): CtaBank {
  const [cta, setCta] = useState<CtaBank>(FALLBACK_CTA);

  useEffect(() => {
    const now = Date.now();

    // Use cached data if it is still fresh.
    if (cachedCta && now - cachedAt < CACHE_TTL_MS) {
      setCta(cachedCta);
      return;
    }

    // Otherwise, fetch fresh data.
    fetch("/api/os-node/os-config-cta-bank")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Partial<CtaBank>) => {
        // Merge with fallback to guarantee all keys exist.
        const merged: CtaBank = { ...FALLBACK_CTA, ...data };
        cachedCta = merged;
        cachedAt = Date.now();
        setCta(merged);
      })
      .catch(() => {
        // On any error, keep the fallback values.
        setCta(FALLBACK_CTA);
      });
  }, []);

  return cta;
}