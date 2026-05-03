"use client";

import { useEffect } from "react";
import { useRegistryStore } from "../_lib/registry-store";
import type { AppDef } from "../_lib/types";

type RegistryPayload = {
  apps: Array<{
    id: string;
    label: string;
    icon: string;
    category?: AppDef["category"];
    modes?: AppDef["modes"];
    singleton?: boolean;
    badge?: number | null;
    defaultSize: { w: number; h: number };
    body:
      | { kind: "node"; nodeName: string }
      | { kind: "iframe"; src: string }
      | { kind: "stub"; title: string; blurb: string; ctaHref?: string; ctaLabel?: string };
  }>;
};

export function RegistryBoot() {
  const setApps = useRegistryStore((s) => s.setApps);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/os-registry", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: RegistryPayload) => {
        if (cancelled) return;
        if (!j || !Array.isArray(j.apps) || !j.apps.length) return;
        const mapped: AppDef[] = j.apps.map((a) => ({
          id: a.id,
          label: a.label,
          icon: a.icon,
          category: a.category,
          modes: a.modes,
          singleton: a.singleton,
          badge: a.badge ?? undefined,
          defaultSize: a.defaultSize,
          body: a.body,
        }));
        setApps(mapped);
      })
      .catch(() => {
        /* fall back to static APPS already in store */
      });
    return () => {
      cancelled = true;
    };
  }, [setApps]);
  return null;
}
