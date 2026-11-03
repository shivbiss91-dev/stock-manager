import React, { useEffect } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { Breadcrumbs } from './Breadcrumbs';
import { NotificationPanel } from './NotificationPanel';
import { useUIStore } from '../../store/uiStore';
import { useThemeStore } from '../../store/themeStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';

export const TopBar: React.FC = () => {
  const {
    setGlobalSearchOpen,
    notificationsPanelOpen,
    setNotificationsPanelOpen,
    setMobileSidebarOpen,
  } = useUIStore();

  const { theme, toggleTheme } = useThemeStore();
  const { unreadCount, loadNotifications } = useNotificationStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return (
    <header className="sticky top-0 z-30 h-16 sm:h-[70px] bg-white dark:bg-[#0B0D14] text-slate-800 dark:text-[#F2F4F8] border-b border-slate-200/80 dark:border-white/[0.06] transition-colors shadow-sm">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: Mobile Drawer Trigger + Brand Logo & Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            aria-label="Open navigation drawer"
          >
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </button>

          {/* Isometric Cube + Wordmark */}
          <div className="flex items-center gap-3">
            <Logo size="sm" showWordmark={true} />
            <div className="hidden lg:block h-5 w-px bg-slate-200 dark:bg-white/[0.08] mx-1" />
            <div className="hidden lg:block min-w-0">
              <Breadcrumbs />
            </div>
            {user?.isDemo && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[10px] font-extrabold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Sweedal – Demo Admin</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Controls: Search, Notifications, Theme Toggle & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Global Search Square Button */}
          <button
            onClick={() => setGlobalSearchOpen(true)}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-[#9AA0AE] hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all group"
            title="Search products, invoices, customers (Ctrl+K)"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-slate-500 dark:text-[#9AA0AE] group-hover:text-brand-orange transition-colors" strokeWidth={1.5} />
          </button>

          {/* Notifications Square Button with unread badge */}
          <div className="relative">
            <button
              onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-[#9AA0AE] hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all relative group"
              title="Notifications"
              aria-label="Open notifications panel"
            >
              <Bell className="w-5 h-5 text-slate-500 dark:text-[#9AA0AE] group-hover:text-brand-orange transition-colors" strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#1A1D26]" />
              )}
            </button>

            <NotificationPanel
              isOpen={notificationsPanelOpen}
              onClose={() => setNotificationsPanelOpen(false)}
            />
          </div>

          {/* Theme Toggle Square Button */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-[#9AA0AE] hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" strokeWidth={1.5} />
            )}
          </button>

          {/* User Avatar tile (Solid Orange Accent #FF6B35) */}
          {user && (
            <div className="pl-1">
              <div
                className="w-10 h-10 rounded-xl bg-brand-orange text-white font-bold flex items-center justify-center text-xs shadow-sm ring-1 ring-white/20 select-none cursor-default"
                title={`${user.name} (${user.role})`}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
