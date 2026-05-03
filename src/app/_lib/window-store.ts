"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppId, WindowState } from "./types";
import { getApps } from "./registry-store";

type Store = {
  windows: WindowState[];
  topZ: number;
  pins: string[];
  /** Side-by-side desktop panels: each entry is the list of app ids in that panel. */
  pages: string[][];
  pageLabels: string[];
  currentPage: number;
  open: (appId: AppId) => string;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, w: number, h: number, x?: number, y?: number) => void;
  restore: (id: string) => void;
  setPins: (pins: string[]) => void;
  pinApp: (appId: string, atIndex?: number) => void;
  unpinApp: (appId: string) => void;
  movePin: (appId: string, toIndex: number) => void;
  setCurrentPage: (page: number) => void;
  addPage: () => void;
  removePage: (page: number) => void;
  moveAppToPage: (appId: string, page: number) => void;
  setPageLabel: (page: number, label: string) => void;
  // Per-panel layout
  panelSettings: PanelSettings[];
  panelWidths: number[];
  setPanelSetting: (page: number, partial: PanelSettings) => void;
  resizePanels: (boundary: number, deltaFraction: number) => void;
  resetPanelWidths: () => void;
};

const TOP_BAR = 96;
const BOTTOM_BAR = 52 + 32; // taskbar + windowlist strip
const RIGHT_RAIL = 44;

function centerPosition(w: number, h: number, i: number) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;
  const usableW = vw - RIGHT_RAIL;
  const usableH = vh - TOP_BAR - BOTTOM_BAR;
  const baseX = Math.max(0, Math.floor((usableW - w) / 2));
  const baseY = Math.max(TOP_BAR, Math.floor(TOP_BAR + (usableH - h) / 2));
  // Tiny cascade so stacked opens don't perfectly overlap.
  const offset = (i % 6) * 24;
  return { x: baseX + offset, y: baseY + offset };
}

const DEFAULT_PINS = [
  "memelli-terminal",
  "tv",
  "radio",
];

// Single default panel — "Home". User splits into more panels via Add panel.
const ALL_DEFAULT_APPS: string[] = [
  // Business
  "pre-qualification", "funding", "credit-repair", "credit-reports", "crm",
  "companies", "deals", "pipelines", "storefront", "revenue-builder",
  "docuvault", "billing",
  // Communications
  "phone", "video-conference", "messages", "memelli-terminal", "voicemail", "social",
  // Productivity & Media
  "workflow-builder", "calendar", "bookings", "notes", "reports", "seo",
  "photos", "tv", "music", "radio",
  // System
  "wallet", "trading", "lockmail", "vpn", "ugc-factory",
];

const DEFAULT_PAGES: string[][] = [ALL_DEFAULT_APPS];
const DEFAULT_PAGE_LABELS: string[] = ["Home"];

export type PanelSettings = {
  cols?: number;
  iconSize?: number;
  labelSize?: number;
  showLabels?: boolean;
};

const DEFAULT_PANEL_SETTINGS: PanelSettings[] = [{}];
const DEFAULT_PANEL_WIDTHS: number[] = [1];

function clampPage(page: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(total - 1, page));
}

export const useWindowStore = create<Store>()(
  persist(
    (set, get) => ({
      windows: [],
      topZ: 100000, // above MelliBar(99997)/Taskbar(99996)/JourneyBar+SignIn(99998) so popups float over bars
      pins: DEFAULT_PINS,
      pages: DEFAULT_PAGES,
      pageLabels: DEFAULT_PAGE_LABELS,
      panelSettings: DEFAULT_PANEL_SETTINGS,
      panelWidths: DEFAULT_PANEL_WIDTHS,
      currentPage: 0,
      open: (appId) => {
        const app = getApps().find((a) => a.id === appId);
        if (!app) return "";
        if (app.singleton) {
          const existing = get().windows.find((w) => w.appId === appId);
          if (existing) {
            get().focus(existing.id);
            if (existing.minimized) get().restore(existing.id);
            return existing.id;
          }
        }
        const id = `${appId}-${Math.random().toString(36).slice(2, 8)}`;
        const i = get().windows.length;
        // 0 in defaultSize.w/h means "60% of viewport" (rectangle, centered — 20% bigger than 50%).
        const vpW = typeof window !== "undefined" ? window.innerWidth : 1280;
        const vpH = typeof window !== "undefined" ? window.innerHeight : 800;
        const w0 = app.defaultSize.w > 0 ? app.defaultSize.w : Math.round(vpW * 0.6);
        const h0 = app.defaultSize.h > 0 ? app.defaultSize.h : Math.round(vpH * 0.6);
        const { x, y } = centerPosition(w0, h0, i);
        const z = get().topZ + 1;
        set((s) => ({
          topZ: z,
          windows: [
            ...s.windows,
            {
              id,
              appId,
              title: app.label,
              icon: app.icon,
              x,
              y,
              w: w0,
              h: h0,
              zIndex: z,
              minimized: false,
              maximized: false,
            },
          ],
        }));
        return id;
      },
      close: (id) =>
        set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),
      focus: (id) =>
        set((s) => {
          const z = s.topZ + 1;
          return {
            topZ: z,
            windows: s.windows.map((w) =>
              w.id === id ? { ...w, zIndex: z, minimized: false } : w,
            ),
          };
        }),
      minimize: (id) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, minimized: true } : w,
          ),
        })),
      restore: (id) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, minimized: false } : w,
          ),
        })),
      toggleMaximize: (id) =>
        set((s) => ({
          windows: s.windows.map((w) => {
            if (w.id !== id) return w;
            if (w.maximized && w.prev) {
              return { ...w, ...w.prev, maximized: false, prev: undefined };
            }
            return {
              ...w,
              prev: { x: w.x, y: w.y, w: w.w, h: w.h },
              x: 0,
              y: 96,
              w:
                typeof window !== "undefined"
                  ? window.innerWidth - 44
                  : 1396,
              h:
                typeof window !== "undefined"
                  ? window.innerHeight - 96 - 52 - 32
                  : 736,
              maximized: true,
            };
          }),
        })),
      move: (id, x, y) =>
        set((s) => ({
          windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
        })),
      resize: (id, w, h, x, y) =>
        set((s) => ({
          windows: s.windows.map((win) =>
            win.id === id
              ? {
                  ...win,
                  w,
                  h,
                  ...(x !== undefined ? { x } : {}),
                  ...(y !== undefined ? { y } : {}),
                }
              : win,
          ),
        })),
      setPins: (pins) => set({ pins }),
      pinApp: (appId, atIndex) =>
        set((s) => {
          const filtered = s.pins.filter((p) => p !== appId);
          const idx =
            atIndex == null
              ? filtered.length
              : Math.max(0, Math.min(filtered.length, atIndex));
          const next = [...filtered];
          next.splice(idx, 0, appId);
          return { pins: next };
        }),
      unpinApp: (appId) =>
        set((s) => ({ pins: s.pins.filter((p) => p !== appId) })),
      movePin: (appId, toIndex) =>
        set((s) => {
          const fromIndex = s.pins.indexOf(appId);
          if (fromIndex < 0) return s;
          const next = [...s.pins];
          next.splice(fromIndex, 1);
          const adjusted = toIndex > fromIndex ? toIndex - 1 : toIndex;
          next.splice(Math.max(0, Math.min(next.length, adjusted)), 0, appId);
          return { pins: next };
        }),
      setCurrentPage: (page) =>
        set((s) => ({ currentPage: clampPage(page, s.pages.length || 1) })),
      addPage: () =>
        set((s) => {
          const focusIdx = clampPage(s.currentPage, s.pages.length);
          // Halve the focused panel to make room for the new one — sum stays 1.
          const oldWidths = s.panelWidths.length === s.pages.length
            ? s.panelWidths
            : s.pages.map(() => 1 / s.pages.length);
          const half = oldWidths[focusIdx] / 2;
          const nextWidths = [...oldWidths];
          nextWidths[focusIdx] = half;
          nextWidths.splice(focusIdx + 1, 0, half);
          return {
            pages: [...s.pages, []],
            pageLabels: [...s.pageLabels, `Panel ${s.pages.length + 1}`],
            panelSettings: [...s.panelSettings, {}],
            panelWidths: nextWidths,
            currentPage: focusIdx + 1,
          };
        }),
      removePage: (page) =>
        set((s) => {
          if (s.pages.length <= 1) return s; // always keep at least one
          const dropped = s.pages[page] ?? [];
          const next = s.pages.filter((_, i) => i !== page);
          const nextLabels = s.pageLabels.filter((_, i) => i !== page);
          const nextSettings = s.panelSettings.filter((_, i) => i !== page);
          // Redistribute the removed panel's width across the remaining ones.
          const dropWidth = s.panelWidths[page] ?? 0;
          const nextWidths = s.panelWidths
            .filter((_, i) => i !== page)
            .map(
              (w) =>
                w + dropWidth / Math.max(1, s.panelWidths.length - 1),
            );
          if (dropped.length > 0) {
            const lastIdx = next.length - 1;
            next[lastIdx] = [...next[lastIdx], ...dropped];
          }
          return {
            pages: next,
            pageLabels: nextLabels,
            panelSettings: nextSettings,
            panelWidths: nextWidths,
            currentPage: clampPage(
              s.currentPage > page ? s.currentPage - 1 : s.currentPage,
              next.length,
            ),
          };
        }),
      moveAppToPage: (appId, page) =>
        set((s) => {
          if (page < 0 || page >= s.pages.length) return s;
          const next = s.pages.map((p) => p.filter((id) => id !== appId));
          next[page] = [...next[page], appId];
          return { pages: next };
        }),
      setPageLabel: (page, label) =>
        set((s) => {
          if (page < 0 || page >= s.pageLabels.length) return s;
          const next = [...s.pageLabels];
          next[page] = label;
          return { pageLabels: next };
        }),
      setPanelSetting: (page, partial) =>
        set((s) => {
          if (page < 0 || page >= s.panelSettings.length) return s;
          const next = [...s.panelSettings];
          next[page] = { ...next[page], ...partial };
          return { panelSettings: next };
        }),
      resizePanels: (boundary, deltaFraction) =>
        set((s) => {
          // boundary is the index between panels — i.e. resizing the divider
          // between panelWidths[boundary] and panelWidths[boundary + 1].
          if (boundary < 0 || boundary >= s.panelWidths.length - 1) return s;
          const MIN = 0.05;
          const left = s.panelWidths[boundary];
          const right = s.panelWidths[boundary + 1];
          const newLeft = Math.max(MIN, Math.min(left + right - MIN, left + deltaFraction));
          const newRight = left + right - newLeft;
          const next = [...s.panelWidths];
          next[boundary] = newLeft;
          next[boundary + 1] = newRight;
          return { panelWidths: next };
        }),
      resetPanelWidths: () =>
        set((s) => ({
          panelWidths: s.pages.map(() => 1 / Math.max(1, s.pages.length)),
        })),
    }),
    {
      name: "memelli-os-store",
      version: 6,
      migrate: (raw, version) => {
        const v = (raw ?? {}) as Partial<Store>;
        const out: Partial<Store> = { ...v };
        // v3 default = single Home panel with all apps. If user has 3+ panels
        // already (from v2), keep them.
        if (!Array.isArray(v.pages) || v.pages.length === 0) {
          out.pages = DEFAULT_PAGES;
        }
        if (
          !Array.isArray(v.pageLabels) ||
          v.pageLabels.length !== (out.pages?.length ?? 0)
        ) {
          out.pageLabels = (out.pages ?? DEFAULT_PAGES).map(
            (_, i) => DEFAULT_PAGE_LABELS[i] ?? `Panel ${i + 1}`,
          );
        }
        const len = (out.pages ?? DEFAULT_PAGES).length;
        if (
          !Array.isArray(v.panelSettings) ||
          v.panelSettings.length !== len
        ) {
          out.panelSettings = Array.from({ length: len }, () => ({}));
        }
        if (
          !Array.isArray(v.panelWidths) ||
          v.panelWidths.length !== len ||
          Math.abs(v.panelWidths.reduce((a, b) => a + b, 0) - 1) > 0.01
        ) {
          out.panelWidths = Array.from({ length: len }, () => 1 / len);
        }
        if (typeof v.currentPage !== "number") out.currentPage = 0;
        // Force pins to canonical default ALWAYS, regardless of version.
        // Operator wants memelli-terminal first, tv, radio — this guarantees
        // the order across stale localStorage.
        out.pins = DEFAULT_PINS;
        if (Array.isArray(out.pages)) {
          out.pages = out.pages.map((page) =>
            page.map((id) => (id === "memelli-chat" ? "memelli-terminal" : id)),
          );
        }
        void version;
        return out as Store;
      },
      partialize: (s) => ({
        // Pins intentionally NOT persisted — always start from DEFAULT_PINS
        // so operator-locked order (memelli-terminal · tv · radio) holds.
        pages: s.pages,
        pageLabels: s.pageLabels,
        panelSettings: s.panelSettings,
        panelWidths: s.panelWidths,
        currentPage: s.currentPage,
      }),
      // Force-reset pins after every rehydrate. Old persisted blobs may still
      // contain stale ids ("memelli-chat") or extra entries that would
      // overwrite the canonical default. This guarantees a clean slate.
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.pins = DEFAULT_PINS;
        }
      },
    },
  ),
);
