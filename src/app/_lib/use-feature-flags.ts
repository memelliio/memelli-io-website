"use client";

import { useEffect, useState } from "react";

export interface FeatureFlags {
  showPersonalMode: boolean;
  showFunding: boolean;
  showCreditRepair: boolean;
  showCreditReports: boolean;
  showPitchModal: boolean;
  showWelcomeBanner: boolean;
  showMobileDock: boolean;
  showAddPageButton: boolean;
}

export const FALLBACK_FLAGS: FeatureFlags = {
  showPersonalMode: false,
  showFunding: false,
  showCreditRepair: false,
  showCreditReports: false,
  showPitchModal: true,
  showWelcomeBanner: true,
  showMobileDock: true,
  showAddPageButton: true,
};

export default FALLBACK_FLAGS;

let cachedFlags: FeatureFlags | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

async function fetchFeatureFlags(): Promise<FeatureFlags> {
  if (cachedFlags && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedFlags;
  }

  const response = await fetch("/api/os-node/os-config-feature-flags", {
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch feature flags: ${response.status}`);
  }

  const source = await response.text();

  // The endpoint returns a CommonJS‑style module that assigns flags to
  // `module.exports.flags`. We evaluate it in an isolated scope.
  const module = { exports: {} as { flags: FeatureFlags } };
  const fn = new Function("module", "exports", `${source}; return module.exports;`);
  const exported = fn(module, module.exports);
  const flags = exported.flags as FeatureFlags;

  cachedFlags = flags;
  cacheTimestamp = Date.now();

  return flags;
}

/**
 * React hook that provides the current feature flags.
 * Starts with a safe fallback and updates when the server data arrives.
 */
export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(FALLBACK_FLAGS);

  useEffect(() => {
    let cancelled = false;

    fetchFeatureFlags()
      .then((fetched) => {
        if (!cancelled) {
          setFlags(fetched);
        }
      })
      .catch(() => {
        // Silently ignore errors; the fallback remains in place.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return flags;
}