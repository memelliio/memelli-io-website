"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BarConfig = {
  enabled: boolean;
  listeningColor: string;
  thinkingColor: string;
  speakingColor: string;
  idleColor: string;
  barBackground: string;
  useRainbow: boolean;
  hueShift: number;
  saturation: number;
  barCount: number;
  barWidth: number;
  barGap: number;
  barShape: "sharp" | "rounded" | "pointed" | "line";
  wavePattern: "wave" | "pulse" | "bars" | "smooth" | "dots" | "equalizer";
  lineWidth: number;
  waveSpread: number;
  mirror: boolean;
  speed: number;
  amplitude: number;
  brightness: number;
  glowIntensity: number;
  pulseEnabled: boolean;
  pulseSpeed: number;
  smoothing: number;
  wavePosition: "behind" | "above" | "off";
  showLogo: boolean;
  showText: boolean;
  barHeight: number;
  barOpacity: number;
  borderGlow: boolean;
  wakeWordEnabled: boolean;
  soundEffects: boolean;
  autoOpen: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
};

export const DEFAULT_BAR_CONFIG: BarConfig = {
  enabled: true,
  listeningColor: "#dc2626",
  thinkingColor: "#eab308",
  speakingColor: "#22c55e",
  idleColor: "#dc2626",
  barBackground: "#0a0a0c",
  useRainbow: false,
  hueShift: 0,
  saturation: 85,
  barCount: 96,
  barWidth: 0.8,
  barGap: 1.5,
  barShape: "sharp",
  wavePattern: "wave",
  lineWidth: 2,
  waveSpread: 0.65,
  mirror: true,
  speed: 1.0,
  amplitude: 1.0,
  brightness: 1.0,
  glowIntensity: 8,
  pulseEnabled: true,
  pulseSpeed: 1.0,
  smoothing: 0.82,
  wavePosition: "behind",
  showLogo: true,
  showText: true,
  barHeight: 96,
  barOpacity: 1.0,
  borderGlow: true,
  wakeWordEnabled: true,
  soundEffects: false,
  autoOpen: true,
  reducedMotion: false,
  highContrast: false,
};

type Store = BarConfig & {
  set: (partial: Partial<BarConfig>) => void;
  reset: () => void;
};

export const useBarConfig = create<Store>()(
  persist(
    (set) => ({
      ...DEFAULT_BAR_CONFIG,
      set: (partial) => set((s) => ({ ...s, ...partial })),
      reset: () => set({ ...DEFAULT_BAR_CONFIG }),
    }),
    {
      name: "memelli_bar_config",
      partialize: (s) => {
        const { set: _s, reset: _r, ...rest } = s;
        return rest;
      },
    },
  ),
);
