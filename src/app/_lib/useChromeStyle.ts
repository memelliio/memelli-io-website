"use client";

import { useEffect, useState } from "react";

// Hardcoded defaults — used if /api/os-node fails. Site NEVER white-screens.
const DEFAULTS = {
  "desktop": {
    "modeToggle": {
      "barHeight": 40,
      "top": 96,
      "buttonPadding": "6px 16px",
      "buttonFontSize": 11,
      "gap": 2,
      "addPanelVisible": true
    },
    "mobileTopPanel": {
      "hidden": true
    },
    "mobileDock": {
      "hidden": true
    },
    "windowFrame": {
      "maxWidth": "min(960px, 96vw)",
      "maxHeight": "92vh"
    },
    "pitchBanner": {
      "layout": "row",
      "maxWidth": "520px",
      "gap": "14px"
    }
  },
  "mobile": {
    "modeToggle": {
      "barHeight": 32,
      "top": 0,
      "buttonPadding": "4px 10px",
      "buttonFontSize": 10,
      "gap": 2,
      "addPanelVisible": false
    },
    "mobileTopPanel": {
      "statusBarHidden": true,
      "actionRowPadding": "4px 10px",
      "actionRowHeight": 30,
      "modeStripPadding": "4px 12px",
      "totalMaxHeight": 80
    },
    "mobileDock": {
      "dockHeight": 56,
      "padding": "8px 12px"
    },
    "windowFrame": {
      "maxWidth": "96vw",
      "maxHeight": "92vh",
      "overflow": "auto"
    },
    "pitchBanner": {
      "layout": "row",
      "maxWidth": "94vw",
      "gap": "12px"
    }
  }
};

let _cache: { tokens: typeof DEFAULTS; ts: number } | null = null;
const TTL_MS = 60_000;

async function fetchTokens(): Promise<typeof DEFAULTS> {
  if (_cache && Date.now() - _cache.ts < TTL_MS) return _cache.tokens;
  try {
    const r = await fetch("/api/os-node/os-design-tokens", { cache: "no-store" });
    if (!r.ok) return DEFAULTS;
    const j = await r.json();
    if (!j.ok || !j.code) return DEFAULTS;
    // The code_text is a CommonJS module exporting { tokens: {...} }.
    // We compile + run it in browser to get the data out.
    const m: { exports: { tokens?: typeof DEFAULTS } } = { exports: {} };
    new Function("module", "exports", j.code)(m, m.exports);
    const tokens = m.exports.tokens;
    if (!tokens || !tokens.desktop || !tokens.mobile) return DEFAULTS;
    _cache = { tokens, ts: Date.now() };
    return tokens;
  } catch {
    return DEFAULTS;
  }
}

export function useChromeStyle(): { tokens: typeof DEFAULTS; isMobile: boolean; ready: boolean } {
  const [isMobile, setIsMobile] = useState(false);
  const [tokens, setTokens] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    fetchTokens().then((t) => {
      setTokens(t);
      setReady(true);
    });
    return () => mql.removeEventListener("change", update);
  }, []);

  return { tokens, isMobile, ready };
}
