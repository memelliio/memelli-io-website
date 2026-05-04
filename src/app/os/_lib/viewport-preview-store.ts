"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";

export type ViewportPreset =
  | "off"
  | "iphone-se"
  | "iphone-14"
  | "iphone-14-pro"
  | "iphone-14-pro-max"
  | "pixel-7"
  | "galaxy-s22"
  | "galaxy-s23-ultra"
  | "ipad-mini"
  | "ipad"
  | "ipad-pro-11"
  | "ipad-pro-129"
  | "galaxy-tab-s8"
  | "laptop"
  | "desktop";

export type ViewportKind = "phone" | "tablet" | "laptop" | "desktop" | "off";

export const VIEWPORT_PRESETS: Record<
  ViewportPreset,
  { label: string; w: number | null; h: number | null; kind: ViewportKind }
> = {
  off: { label: "Full", w: null, h: null, kind: "off" },
  // Phones
  "iphone-se": { label: "iPhone SE", w: 375, h: 667, kind: "phone" },
  "iphone-14": { label: "iPhone 14", w: 390, h: 844, kind: "phone" },
  "iphone-14-pro": { label: "iPhone 14 Pro", w: 393, h: 852, kind: "phone" },
  "iphone-14-pro-max": { label: "iPhone 14 Pro Max", w: 430, h: 932, kind: "phone" },
  "pixel-7": { label: "Pixel 7", w: 412, h: 915, kind: "phone" },
  "galaxy-s22": { label: "Galaxy S22", w: 360, h: 780, kind: "phone" },
  "galaxy-s23-ultra": { label: "Galaxy S23 Ultra", w: 412, h: 915, kind: "phone" },
  // Tablets
  "ipad-mini": { label: "iPad Mini", w: 744, h: 1133, kind: "tablet" },
  ipad: { label: "iPad", w: 820, h: 1180, kind: "tablet" },
  "ipad-pro-11": { label: "iPad Pro 11″", w: 834, h: 1194, kind: "tablet" },
  "ipad-pro-129": { label: "iPad Pro 12.9″", w: 1024, h: 1366, kind: "tablet" },
  "galaxy-tab-s8": { label: "Galaxy Tab S8", w: 753, h: 1205, kind: "tablet" },
  // Larger
  laptop: { label: "Laptop", w: 1280, h: 800, kind: "laptop" },
  desktop: { label: "Desktop", w: 1920, h: 1080, kind: "desktop" },
};

export const PRESET_GROUPS: { title: string; presets: ViewportPreset[] }[] = [
  { title: "Default", presets: ["off"] },
  {
    title: "Phones",
    presets: [
      "iphone-se",
      "iphone-14",
      "iphone-14-pro",
      "iphone-14-pro-max",
      "pixel-7",
      "galaxy-s22",
      "galaxy-s23-ultra",
    ],
  },
  {
    title: "Tablets",
    presets: [
      "ipad-mini",
      "ipad",
      "ipad-pro-11",
      "ipad-pro-129",
      "galaxy-tab-s8",
    ],
  },
  { title: "Larger", presets: ["laptop", "desktop"] },
];

type Store = {
  preset: ViewportPreset;
  setPreset: (p: ViewportPreset) => void;
};

export const useViewportPreview = create<Store>()(
  persist(
    (set) => ({
      preset: "off",
      setPreset: (p) => set({ preset: p }),
    }),
    {
      name: "memelli_viewport_preview",
      version: 2,
      // v2: preset keys renamed (mobile/phablet → iphone-14, iphone-14-pro-max).
      // Reset stale keys to "off" so old saved values don't crash.
      migrate: (raw, version) => {
        const v = (raw ?? {}) as Partial<Store>;
        if (
          !v.preset ||
          !(v.preset in VIEWPORT_PRESETS) ||
          (typeof version === "number" && version < 2)
        ) {
          return { preset: "off" } as Store;
        }
        return v as Store;
      },
    },
  ),
);

/**
 * Truth source for "are we rendering as a phone right now?"
 * Combines (a) preview preset of kind=phone and (b) actual narrow window.
 */
export function useIsMobileSurface(): boolean {
  const preset = useViewportPreview((s) => s.preset);
  const meta = VIEWPORT_PRESETS[preset] ?? VIEWPORT_PRESETS.off;
  // Synchronous initializer so the first paint on a real phone reads the
  // viewport correctly — otherwise useState(false) flashes the desktop
  // layout before useEffect swaps it. iPhone Safari shows that flash long
  // enough that the operator perceived "not responsive" on iPhone 11.
  const [matchNarrow, setMatchNarrow] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.matchMedia("(max-width: 600px)").matches;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 600px)");
    setMatchNarrow(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMatchNarrow(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  if (preset === "off") return matchNarrow;
  return meta.kind === "phone";
}
