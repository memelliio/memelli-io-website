import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface UIState {
  sidebarCollapsed: boolean;
  fireStickMenuOpen: boolean;
  commandPaletteOpen: boolean;
  notificationPanelOpen: boolean;
  activeModal: string | null;
  theme: Theme;
  /** Current active TV channel title shown in TopBar */
  activeChannelId: string;
  activeChannelTitle: string;
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleFireStickMenu: () => void;
  setFireStickMenuOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleNotificationPanel: () => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
  toggleTheme: () => void;
  setActiveChannel: (id: string, title: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      fireStickMenuOpen: false,
      commandPaletteOpen: false,
      notificationPanelOpen: false,
      activeModal: null,
      theme: 'dark' as Theme,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toggleFireStickMenu: () =>
        set((state) => ({ fireStickMenuOpen: !state.fireStickMenuOpen })),

      setFireStickMenuOpen: (open) => set({ fireStickMenuOpen: open }),

      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      toggleNotificationPanel: () =>
        set((state) => ({ notificationPanelOpen: !state.notificationPanelOpen })),

      openModal: (modal) => set({ activeModal: modal }),

      closeModal: () => set({ activeModal: null }),

      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      activeChannelId: '',
      activeChannelTitle: '',
      setActiveChannel: (id, title) => set({ activeChannelId: id, activeChannelTitle: title }),
    }),
    {
      name: 'memelli-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
