import { create } from 'zustand';
import { PeriodType, DateRange } from '../types/common';

interface UIStore {
  selectedWarehouseId: string;
  period: PeriodType;
  customDateRange: DateRange | null;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  globalSearchOpen: boolean;
  keyboardShortcutsOpen: boolean;
  notificationsPanelOpen: boolean;
  dashboardLayoutOpen: boolean;
  favourites: string[];

  setSelectedWarehouseId: (id: string) => void;
  setPeriod: (period: PeriodType, customRange?: DateRange) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setGlobalSearchOpen: (open: boolean) => void;
  setKeyboardShortcutsOpen: (open: boolean) => void;
  setNotificationsPanelOpen: (open: boolean) => void;
  setDashboardLayoutOpen: (open: boolean) => void;
  toggleFavourite: (itemId: string) => void;
  isFavourite: (itemId: string) => boolean;
}

const FAVOURITES_KEY = 'stockvista_favourites';

export const useUIStore = create<UIStore>((set, get) => {
  let initialFavourites: string[] = [];
  try {
    const raw = localStorage.getItem(FAVOURITES_KEY);
    if (raw) initialFavourites = JSON.parse(raw);
  } catch {
    initialFavourites = [];
  }

  return {
    selectedWarehouseId: 'all',
    period: 'month',
    customDateRange: null,
    sidebarCollapsed: true,
    mobileSidebarOpen: false,
    globalSearchOpen: false,
    keyboardShortcutsOpen: false,
    notificationsPanelOpen: false,
    dashboardLayoutOpen: false,
    favourites: initialFavourites,

    setSelectedWarehouseId: (id: string) => set({ selectedWarehouseId: id }),
    setPeriod: (period: PeriodType, customRange?: DateRange) =>
      set({ period, customDateRange: customRange || null }),
    setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setMobileSidebarOpen: (open: boolean) => set({ mobileSidebarOpen: open }),
    setGlobalSearchOpen: (open: boolean) => set({ globalSearchOpen: open }),
    setKeyboardShortcutsOpen: (open: boolean) => set({ keyboardShortcutsOpen: open }),
    setNotificationsPanelOpen: (open: boolean) => set({ notificationsPanelOpen: open }),
    setDashboardLayoutOpen: (open: boolean) => set({ dashboardLayoutOpen: open }),

    toggleFavourite: (itemId: string) => {
      const current = get().favourites;
      const next = current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId];
      try {
        localStorage.setItem(FAVOURITES_KEY, JSON.stringify(next));
      } catch {}
      set({ favourites: next });
    },

    isFavourite: (itemId: string) => get().favourites.includes(itemId),
  };
});
