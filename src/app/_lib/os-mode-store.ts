"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OsMode = "personal" | "business";

type Store = {
  mode: OsMode;
  /** Which business app frame is open in the BusinessCenter (null = home). */
  businessApp: string | null;
  /** Which row/entity inside the active business app is focused (e.g. contactId). */
  focusedEntity: string | null;
  setMode: (mode: OsMode) => void;
  toggleMode: () => void;
  setBusinessApp: (id: string | null) => void;
  setFocusedEntity: (id: string | null) => void;
};

export const useOsMode = create<Store>()(
  persist(
    (set, get) => ({
      mode: "personal",
      businessApp: null,
      focusedEntity: null,
      setMode: (mode) => set({ mode }),
      toggleMode: () =>
        set({ mode: get().mode === "personal" ? "business" : "personal" }),
      setBusinessApp: (id) => set({ businessApp: id, focusedEntity: null }),
      setFocusedEntity: (id) => set({ focusedEntity: id }),
    }),
    {
      name: "memelli_os_mode",
      partialize: (s) => ({
        mode: s.mode,
        businessApp: s.businessApp,
      }),
    },
  ),
);
