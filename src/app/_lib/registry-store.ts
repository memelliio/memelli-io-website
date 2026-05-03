"use client";

import { create } from "zustand";
import { APPS as STATIC_APPS } from "../_apps/registry";
import type { AppDef } from "./types";

type RegistryState = {
  apps: AppDef[];
  setApps: (apps: AppDef[]) => void;
};

export const useRegistryStore = create<RegistryState>((set) => ({
  apps: STATIC_APPS,
  setApps: (apps) => set({ apps }),
}));

// Synchronous getter for non-React modules (window-store).
export function getApps(): AppDef[] {
  return useRegistryStore.getState().apps;
}
