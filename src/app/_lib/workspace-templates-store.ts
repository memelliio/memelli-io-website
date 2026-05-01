"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModuleId } from "./contact-store";

export type WorkspaceTemplate = {
  id: string;
  name: string;
  tabs: ModuleId[];
};

const DEFAULT_TEMPLATES: WorkspaceTemplate[] = [
  {
    id: "crm-default",
    name: "CRM Default",
    tabs: ["prequal", "credit-repair", "funding"],
  },
  {
    id: "follow-up",
    name: "Client Follow-up",
    tabs: ["profile", "tasks", "calls", "email", "notes"],
  },
  {
    id: "credit-deep-dive",
    name: "Credit Deep Dive",
    tabs: ["credit-score", "credit-report", "credit-repair", "files"],
  },
  {
    id: "funding-flow",
    name: "Funding Flow",
    tabs: ["prequal", "decision", "funding", "files", "tasks"],
  },
];

type Store = {
  templates: WorkspaceTemplate[];
  save: (name: string, tabs: ModuleId[]) => string;
  remove: (id: string) => void;
  reset: () => void;
};

function uid() {
  return `tpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const useWorkspaceTemplates = create<Store>()(
  persist(
    (set) => ({
      templates: DEFAULT_TEMPLATES,
      save: (name, tabs) => {
        const id = uid();
        set((s) => ({
          templates: [
            ...s.templates,
            { id, name: name.trim() || "Untitled", tabs: [...tabs] },
          ],
        }));
        return id;
      },
      remove: (id) =>
        set((s) => ({
          templates: s.templates.filter((t) => t.id !== id),
        })),
      reset: () => set({ templates: DEFAULT_TEMPLATES }),
    }),
    {
      name: "memelli_workspace_templates",
    },
  ),
);
