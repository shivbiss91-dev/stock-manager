import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Calendar,
  Menu,
  ChevronDown,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { Breadcrumbs } from './Breadcrumbs';
import { NotificationPanel } from './NotificationPanel';
import { useUIStore } from '../../store/uiStore';
import { useThemeStore } from '../../store/themeStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import { PeriodType } from '../../types/common';
import { changeAppLanguage, SUPPORTED_LANGUAGES } from '../../i18n';
import { useTranslation } from 'react-i18next';

export const TopBar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    period,
    setPeriod,
    setGlobalSearchOpen,
    notificationsPanelOpen,
    setNotificationsPanelOpen,
    setMobileSidebarOpen,
    dashboardLayoutOpen,
    setDashboardLayoutOpen,
  } = useUIStore();

  const { theme, toggleTheme } = useThemeStore();
  const { unreadCount, loadNotifications } = useNotificationStore();
  const { user } = useAuthStore();

  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const periods: { id: PeriodType; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'FY 2026-27' },
    { id: 'custom', label: 'Custom' },
  ];

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
          </div>
        </div>

        {/* Right Controls: Period Dropdown + Square Icon Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Period Dropdown */}
          <div className="relative hidden sm:flex items-center">
            <div className="relative flex items-center gap-2 bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-[#F2F4F8] shadow-sm hover:border-brand-orange/40 transition-colors">
              <Calendar className="w-4 h-4 text-brand-orange" strokeWidth={1.5} />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodType)}
                className="bg-transparent text-xs text-slate-800 dark:text-[#F2F4F8] appearance-none pr-5 focus:outline-none cursor-pointer font-medium"
              >
                {periods.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    className="bg-white dark:bg-[#12151D] text-slate-800 dark:text-white"
                  >
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" strokeWidth={1.5} />
            </div>
          </div>

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

          {/* Layout / Customize Square Button */}
          <button
            onClick={() => setDashboardLayoutOpen(!dashboardLayoutOpen)}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-[#9AA0AE] hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all group"
            title="Customize Dashboard Layout"
            aria-label="Customize dashboard"
          >
            <SlidersHorizontal className="w-5 h-5 text-slate-500 dark:text-[#9AA0AE] group-hover:text-brand-orange transition-colors" strokeWidth={1.5} />
          </button>

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

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-[#9AA0AE] hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all"
              title="Change language"
              aria-label="Change language"
            >
              <Globe className="w-5 h-5 text-slate-500 dark:text-[#9AA0AE]" strokeWidth={1.5} />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 rounded-xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-white/[0.08] shadow-xl py-1 z-50">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      changeAppLanguage(lang.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                      i18n.language === lang.code
                        ? 'font-bold text-brand-orange bg-slate-50 dark:bg-white/5'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{lang.native}</span>
                    <span className="text-[10px] text-slate-400">{lang.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

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
