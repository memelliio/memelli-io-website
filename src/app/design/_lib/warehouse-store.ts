"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AssetStatus = "raw" | "approved" | "rejected" | "usable";

type Store = {
  status: Record<string, AssetStatus>;
  notes: Record<string, string>;
  setStatus: (id: string, s: AssetStatus) => void;
  setNote: (id: string, n: string) => void;
  resetStatus: (id: string) => void;
};

export const useWarehouse = create<Store>()(
  persist(
    (set) => ({
      status: {},
      notes: {},
      setStatus: (id, s) =>
        set((st) => ({ status: { ...st.status, [id]: s } })),
      setNote: (id, n) =>
        set((st) => ({ notes: { ...st.notes, [id]: n } })),
      resetStatus: (id) =>
        set((st) => {
          const next = { ...st.status };
          delete next[id];
          return { status: next };
        }),
    }),
    { name: "memelli_design_warehouse" },
  ),
);

export function getStatus(
  map: Record<string, AssetStatus>,
  id: string,
): AssetStatus {
  return map[id] ?? "raw";
}
