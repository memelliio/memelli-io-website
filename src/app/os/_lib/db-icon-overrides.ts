"use client";

import { useEffect, useState } from "react";

// Fetches /api/os-registry once per session and returns a Map<appId, iconUrl>.
// Components use this to OVERRIDE the hardcoded icon path in registry.tsx.
// Result: editing an icon row in DB → live in <5s without a Next.js redeploy.

export function useDbIconOverrides(): Map<string, string> {
  const [overrides, setOverrides] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/os-registry", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const m = new Map<string, string>();
        for (const a of j.apps ?? []) {
          if (a.id && a.icon) m.set(a.id, a.icon);
        }
        setOverrides(m);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return overrides;
}
