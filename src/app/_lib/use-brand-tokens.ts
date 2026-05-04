"use client";

import { useEffect, useState } from "react";

type BrandTokens = {
  colors: {
    red: string;
    red2: string;
    ink: string;
    paper: string;
    line: string;
    muted: string;
    bg: string;
    bg2: string;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    card: string;
    pop: string;
  };
  typography: {
    family: string;
    eyebrowSize: string;
    eyebrowSpacing: string;
    h1Size: string;
    bodySize: string;
  };
};

export const FALLBACK_TOKENS: BrandTokens = {
  colors: {
    red: "#C41E3A",
    red2: "#A8182F",
    ink: "#0B0B0F",
    paper: "#FFFFFF",
    line: "#E5E7EB",
    muted: "#6B7280",
    bg: "#FAFAFA",
    bg2: "#F2F3F5",
  },
  radii: {
    sm: "2px",
    md: "4px",
    lg: "8px",
    xl: "12px",
  },
  shadows: {
    card: "0 1px 3px rgba(0,0,0,0.1)",
    pop: "0 4px 6px rgba(0,0,0,0.15)",
  },
  typography: {
    family: "system-ui, sans-serif",
    eyebrowSize: "0.75rem",
    eyebrowSpacing: "0.125rem",
    h1Size: "2rem",
    bodySize: "1rem",
  },
};

let cachedTokens: BrandTokens | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 60 seconds

async function fetchBrandTokens(): Promise<BrandTokens> {
  try {
    const res = await fetch("/api/os-node/os-config-brand-tokens", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return FALLBACK_TOKENS;
    }

    const data = (await res.json()) as BrandTokens;
    return data ?? FALLBACK_TOKENS;
  } catch {
    return FALLBACK_TOKENS;
  }
}

/**
 * React hook that returns the brand tokens for the site.
 * It caches the result for 60 seconds to avoid unnecessary network requests.
 * If the request fails, it falls back to a hard‑coded token set.
 */
export function useBrandTokens(): BrandTokens {
  const [tokens, setTokens] = useState<BrandTokens>(FALLBACK_TOKENS);

  useEffect(() => {
    const now = Date.now();

    if (cachedTokens && now - cacheTimestamp < CACHE_TTL) {
      setTokens(cachedTokens);
      return;
    }

    void fetchBrandTokens().then((data) => {
      cachedTokens = data;
      cacheTimestamp = Date.now();
      setTokens(data);
    });
  }, []);

  return tokens;
}