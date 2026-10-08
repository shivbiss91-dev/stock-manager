import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

const THEME_STORAGE_KEY = 'stockvista_theme';

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'dark',

  initTheme: () => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const initialTheme: Theme = saved === 'dark' || saved === 'light' ? saved : 'dark';
    
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    set({ theme: initialTheme });
  },

  toggleTheme: () => {
    const current = get().theme;
    const next: Theme = current === 'light' ? 'dark' : 'light';
    
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem(THEME_STORAGE_KEY, next);
    set({ theme: next });
  },

  setTheme: (theme: Theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    set({ theme });
  },
}));
