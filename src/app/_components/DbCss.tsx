"use client";

import { useEffect, useState } from "react";

let _cache: { css: string; ts: number } | null = null;
const TTL_MS = 30_000;

async function fetchCss(): Promise<string> {
  if (_cache && Date.now() - _cache.ts < TTL_MS) return _cache.css;
  try {
    const r = await fetch("/api/os-node/os-extra-css", { cache: "no-store" });
    if (!r.ok) return "";
    const j = (await r.json()) as { ok?: boolean; code?: string };
    if (!j.ok || typeof j.code !== "string") return "";
    _cache = { css: j.code, ts: Date.now() };
    return j.code;
  } catch {
    return "";
  }
}

export function DbCss(): null {
  const [css, setCss] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    fetchCss().then((c) => { if (!cancelled) setCss(c); });
    const interval = setInterval(() => {
      fetchCss().then((c) => { if (!cancelled) setCss(c); });
    }, TTL_MS + 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!css) return;
    const id = "memelli-db-css";
    let style = document.getElementById(id) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      document.head.appendChild(style);
    }
    if (style.textContent !== css) style.textContent = css;
  }, [css]);

  return null;
}
