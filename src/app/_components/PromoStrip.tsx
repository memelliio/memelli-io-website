// src/app/_components/PromoStrip.tsx
"use client";

import { useEffect, useState } from "react";

type PromoData = {
  enabled: boolean;
  text: string;
  background: string;
  color: string;
  ctaLabel?: string;
  ctaAppId?: string;
};

const CACHE_TTL = 60_000; // 60 seconds

let cachedPromo: PromoData | null = null;
let cachedAt = 0;

/**
 * Fetches the promo configuration, using a simple in‑memory cache that lives
 * for 60 seconds. If the request fails the function returns `null`.
 */
async function getPromo(): Promise<PromoData | null> {
  const now = Date.now();

  if (cachedPromo && now - cachedAt < CACHE_TTL) {
    return cachedPromo;
  }

  try {
    const res = await fetch("/api/os-node/os-config-promo-strip", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as PromoData;
    cachedPromo = data;
    cachedAt = now;
    return data;
  } catch {
    return null;
  }
}

/**
 * Top‑of‑page promotional strip.
 *
 * Renders nothing when the promo is disabled or the fetch fails.
 */
export const PromoStrip = () => {
  const [promo, setPromo] = useState<PromoData | null>(null);

  useEffect(() => {
    let cancelled = false;

    getPromo().then((data) => {
      if (!cancelled && data?.enabled) {
        setPromo(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!promo) return null;

  const handleClick = () => {
    if (!promo.ctaAppId) return;
    const ev = new CustomEvent("memelli:open-app", {
      detail: { appId: promo.ctaAppId },
    });
    window.dispatchEvent(ev);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 32,
        zIndex: 100,
        padding: "0 16px",
        background: promo.background,
        color: promo.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        fontSize: "14px",
        lineHeight: "32px",
      }}
    >
      <span>{promo.text}</span>
      {promo.ctaLabel && promo.ctaAppId && (
        <button
          type="button"
          onClick={handleClick}
          style={{
            background: "transparent",
            border: `1px solid ${promo.color}`,
            color: promo.color,
            borderRadius: 4,
            padding: "2px 8px",
            cursor: "pointer",
            fontSize: "inherit",
          }}
        >
          {promo.ctaLabel}
        </button>
      )}
    </div>
  );
};