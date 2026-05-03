"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WallpaperStyle =
  | "soft-red-glow"
  | "white-paper"
  | "warm-gradient"
  | "ink-dark";

export type OsConfig = {
  // Display
  gridCols: number; // 5..10
  iconSize: number; // 64..128
  labelSize: number; // 10..16
  showLabels: boolean;
  showBadges: boolean;
  wallpaperStyle: WallpaperStyle;

  // Behavior
  scrollSpeedMul: number; // 1..5 wheel multiplier inside pages
  pageSnapAnimMs: number; // 200..600
  edgeAutoScrollMs: number; // 200..800
  defaultWindowW: number; // 480..1200
  defaultWindowH: number; // 360..900
  rememberWindowPositions: boolean;

  // Brand
  accentColor: string; // hex
  cornerRadius: number; // 6..20

  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;
  focusRingThickness: number; // 0..4
};

export const DEFAULT_OS_CONFIG: OsConfig = {
  gridCols: 8,
  iconSize: 88,
  labelSize: 13,
  showLabels: true,
  showBadges: true,
  wallpaperStyle: "soft-red-glow",
  scrollSpeedMul: 2,
  pageSnapAnimMs: 380,
  edgeAutoScrollMs: 350,
  defaultWindowW: 720,
  defaultWindowH: 480,
  rememberWindowPositions: true,
  accentColor: "var(--brand-color, #C41E3A)",
  cornerRadius: 12,
  reducedMotion: false,
  highContrast: false,
  focusRingThickness: 2,
};

type Store = OsConfig & {
  set: (partial: Partial<OsConfig>) => void;
  reset: () => void;
};

export const useOsConfig = create<Store>()(
  persist(
    (set) => ({
      ...DEFAULT_OS_CONFIG,
      set: (partial) => set((s) => ({ ...s, ...partial })),
      reset: () => set({ ...DEFAULT_OS_CONFIG }),
    }),
    {
      name: "memelli_os_config",
      partialize: (s) => {
        const { set: _s, reset: _r, ...rest } = s;
        return rest;
      },
    },
  ),
);

export function wallpaperBackground(style: WallpaperStyle): string {
  switch (style) {
    case "white-paper":
      return "#FFFFFF";
    case "warm-gradient":
      return "linear-gradient(135deg, #FFF7F2 0%, #FFFFFF 50%, #FCE7EC 100%)";
    case "ink-dark":
      return "linear-gradient(180deg, #0F1115 0%, #18181C 100%)";
    case "soft-red-glow":
    default:
      return "radial-gradient(circle at 20% 20%, rgba(196,30,58,0.05) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(196,30,58,0.04) 0%, transparent 40%), hsl(var(--background))";
  }
}
