"use client";

import { useEffect, useState } from "react";

/**
 * Shape of a pitch object.
 */
export type Pitch = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
};

/**
 * Hard‑coded fallback pitches for the three business‑only apps.
 */
export const FALLBACK_PITCHES: Record<string, Pitch> = {
  crm: {
    eyebrow: "CRM",
    title: "Manage your customers",
    description: "A powerful CRM to keep track of leads and deals.",
    ctaLabel: "Get Started",
  },
  notes: {
    eyebrow: "Notes",
    title: "Capture ideas instantly",
    description: "Take notes, organize them, and never lose a thought.",
    ctaLabel: "Create Note",
  },
  "memelli-terminal": {
    eyebrow: "Terminal",
    title: "Command line at your fingertips",
    description: "Run commands, scripts, and automate tasks.",
    ctaLabel: "Open Terminal",
  },
};

/**
 * In‑memory cache for the API response.
 * Cached for 60 seconds (60000 ms).
 */
type PitchResponse = Record<string, Pitch>;

let cache: {
  data: PitchResponse | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

/**
 * Hook that returns the pitch for a given `appId`.
 *
 * - Returns the hard‑coded fallback immediately (if one exists).
 * - Fetches `/api/os-node/os-config-pitch-content` in the background.
 * - If the cached response is still fresh (≤ 60 s) it is used directly.
 * - Once the live data arrives, the hook updates to the fetched pitch.
 *
 * @param appId The identifier of the app whose pitch we want.
 * @returns The pitch object or `null` if none is available.
 */
export function usePitchContent(appId: string): Pitch | null {
  const fallback = FALLBACK_PITCHES[appId] ?? null;
  const [pitch, setPitch] = useState<Pitch | null>(fallback);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Use fresh cache if possible.
      if (cache.data && Date.now() - cache.timestamp < 60_000) {
        const cached = cache.data[appId];
        if (!cancelled) setPitch(cached ?? fallback);
        return;
      }

      try {
        const res = await fetch("/api/os-node/os-config-pitch-content", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Pitch fetch failed: ${res.status}`);
        }

        const json: PitchResponse = await res.json();

        // Update the module‑level cache.
        cache = {
          data: json,
          timestamp: Date.now(),
        };

        if (!cancelled) {
          const live = json[appId];
          setPitch(live ?? fallback);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setPitch(fallback);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [appId]);

  return pitch;
}