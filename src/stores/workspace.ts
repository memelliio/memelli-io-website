import { create } from 'zustand';

interface WorkspaceState {
  // Selected record
  selectedRecord: { id: string; type: string; data?: any } | null;
  selectRecord: (record: { id: string; type: string; data?: any }) => void;
  clearSelection: () => void;

  // Panel
  panelOpen: boolean;
  panelWidth: 'sm' | 'md' | 'lg' | 'xl';
  openPanel: (width?: 'sm' | 'md' | 'lg' | 'xl') => void;
  closePanel: () => void;

  // Panel stack (for nested panels)
  panelStack: { id: string; type: string; data?: any }[];
  pushPanel: (panel: { id: string; type: string; data?: any }) => void;
  popPanel: () => void;
  clearPanelStack: () => void;

  // Active product
  activeProduct: string | null;
  setActiveProduct: (slug: string | null) => void;

  // Breadcrumb
  breadcrumbs: { label: string; href?: string }[];
  setBreadcrumbs: (crumbs: { label: string; href?: string }[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  // Selected record
  selectedRecord: null,
  selectRecord: (record) =>
    set({ selectedRecord: record, panelOpen: true, panelStack: [record] }),
  clearSelection: () => set({ selectedRecord: null }),

  // Panel
  panelOpen: false,
  panelWidth: 'md',
  openPanel: (width) => set({ panelOpen: true, panelWidth: width ?? 'md' }),
  closePanel: () =>
    set({ panelOpen: false, selectedRecord: null, panelStack: [] }),

  // Panel stack
  panelStack: [],
  pushPanel: (panel) =>
    set((state) => ({
      selectedRecord: panel,
      panelOpen: true,
      panelStack: [...state.panelStack, panel],
    })),
  popPanel: () =>
    set((state) => {
      const newStack = state.panelStack.slice(0, -1);
      const previous = newStack[newStack.length - 1] ?? null;
      return {
        panelStack: newStack,
        selectedRecord: previous,
        panelOpen: newStack.length > 0,
      };
    }),
  clearPanelStack: () => set({ panelStack: [], selectedRecord: null, panelOpen: false }),

  // Active product
  activeProduct: null,
  setActiveProduct: (slug) => set({ activeProduct: slug }),

  // Breadcrumb
  breadcrumbs: [],
  setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),
}));
