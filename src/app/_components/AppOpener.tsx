"use client";

import { useEffect } from "react";
import { useWindowStore } from "../_lib/window-store";

/**
 * Resolves which app window to auto-open and installs the
 * `window.__memelliWindows` bridge so DB-resident node apps
 * (os-app-signup etc.) can call `window.__memelliWindows.open('<id>')`.
 *
 * Sources (priority order): `?app=<id>` query · path-based aliases
 * (/signup → signup, /prequal → pre-qualification, /credit-repair → credit-repair).
 */
export function AppOpener() {
  const open = useWindowStore((s) => s.open);
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as { __memelliWindows?: { open: (id: string) => void } }).__memelliWindows = {
      open: (id: string) => open(id),
    };
    const params = new URLSearchParams(window.location.search);
    let appId: string | null = params.get("app");
    if (!appId) {
      const path = window.location.pathname;
      if (path === "/signup") appId = "signup";
      else if (path === "/prequal" || path === "/pre-qualification") appId = "pre-qualification";
      else if (path === "/credit-repair" || path === "/credit") appId = "credit-repair";
    }
    if (appId) {
      const id = appId;
      const t = window.setTimeout(() => open(id), 50);
      return () => window.clearTimeout(t);
    }
  }, [open]);
  return null;
}
