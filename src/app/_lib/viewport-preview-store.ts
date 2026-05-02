"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewportPreset = "off" | "mobile" | "phablet" | "tablet" | "laptop";

export const VIEWPORT_PRESETS: Record<
  ViewportPreset,
  { label: string; w: number | null; h: number | null }
> = {
  off: { label: "Full", w: null, h: null },
  mobile: { label: "iPhone 14", w: 390, h: 844 },
  phablet: { label: "iPhone Pro Max", w: 430, h: 932 },
  tablet: { label: "iPad", w: 820, h: 1180 },
  laptop: { label: "Laptop", w: 1280, h: 800 },
};

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
    { name: "memelli_viewport_preview" },
  ),
);
