"use client";

import { useEffect } from "react";
import { useWindowStore } from "../_lib/window-store";

/**
 * Reads `?app=<id>` from the URL and opens that app on mount.
 * Lets external links (e.g. Downloads/site-designs/INDEX.html) deep-link
 * straight into a specific app inside the OS shell.
 */
export function AppOpener() {
  const open = useWindowStore((s) => s.open);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const appId = params.get("app");
    if (appId) {
      // Defer one tick so the desktop hydrates first.
      const t = window.setTimeout(() => open(appId), 50);
      return () => window.clearTimeout(t);
    }
  }, [open]);
  return null;
}
