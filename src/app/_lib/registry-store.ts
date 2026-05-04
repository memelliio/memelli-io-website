"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { APPS as STATIC_APPS } from "../_apps/registry";
import type { AppDef } from "./types";

type RegistryState = {
  apps: AppDef[];
  setApps: (apps: AppDef[]) => void;
};

export const useRegistryStore = create<RegistryState>((set) => ({
  apps: STATIC_APPS,
  setApps: (apps) => set({ apps }),
}));

// Synchronous getter for non‑React modules (window‑store).
export function getApps(): AppDef[] {
  return useRegistryStore.getState().apps;
}

/**
 * Fetches the remote app registry, evaluates the returned module code,
 * and extracts the exported `apps` array.
 *
 * The endpoint is expected to return JavaScript that assigns to
 * `module.exports.apps` (e.g. `module.exports = { apps: [...] }`).
 *
 * @returns An array of `AppDef` objects on success, otherwise `null`.
 */
export async function fetchRemoteRegistry(): Promise<AppDef[] | null> {
  try {
    const res = await fetch("/api/os-node/os-config-app-registry", {
      method: "GET",
      credentials: "same-origin",
    });

    if (!res.ok) return null;

    const code = await res.text();

    // Prepare a minimal CommonJS‑like environment for the evaluated code.
    const m: { exports: { apps?: AppDef[] } } = { exports: {} };

    // Evaluate the code in a sandboxed function.
    // eslint-disable-next-line no-new-func
    const fn = new Function("module", "exports", code);
    fn(m, m.exports);

    // The remote module should expose `apps`.
    if (Array.isArray(m.exports.apps)) {
      return m.exports.apps;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * React hook that lazily fetches the remote registry once on component mount.
 * If the fetch succeeds, it overwrites the store's `apps` with the remote data.
 */
export function useRegistryFetcher(): void {
  const setApps = useRegistryStore((state) => state.setApps);

  useEffect(() => {
    let cancelled = false;

    fetchRemoteRegistry().then((remoteApps) => {
      if (!cancelled && remoteApps) {
        setApps(remoteApps);
      }
    });

    return () => {
      cancelled = true;
    };
    // Empty dependency array ensures this runs only once per mount.
  }, [setApps]);
}