import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Sun,
  Moon,
  Globe,
  LogOut,
  ShieldCheck,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Role } from '../../types/auth';
import { changeAppLanguage, SUPPORTED_LANGUAGES } from '../../i18n';
import { useTranslation } from 'react-i18next';

interface UserMenuProps {
  collapsed?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ collapsed = false }) => {
  const { t, i18n } = useTranslation();
  const { user, logout, switchRole } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showRoleSubmenu, setShowRoleSubmenu] = useState(false);
  const [showLangSubmenu, setShowLangSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowRoleSubmenu(false);
        setShowLangSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const roleColors: Record<Role, string> = {
    admin: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
    manager: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
    staff: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    viewer: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  const handleRoleSelect = (role: Role) => {
    switchRole(role);
    setIsOpen(false);
    setShowRoleSubmenu(false);
  };

  const handleLangSelect = (code: string) => {
    changeAppLanguage(code);
    setIsOpen(false);
    setShowLangSubmenu(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger: Either Collapsed Avatar Tile or Expanded User Card */}
      {collapsed ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-11 h-11 rounded-xl bg-brand-orange text-white font-bold flex items-center justify-center text-sm shadow-md ring-1 ring-white/20 hover:scale-105 active:scale-95 transition-all group"
          title={`${user.name} (${user.role}) - Profile & Settings`}
          aria-label="User account menu"
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
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 dark:bg-[#1A1D26] hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors group text-left border border-slate-200/80 dark:border-white/[0.08]"
          aria-label="User account menu"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-brand-orange/30"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-brand-orange text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1A1D26]" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-[#F2F4F8] truncate">
                {user.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${roleColors[user.role]}`}
                >
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 w-64 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-white/[0.08] shadow-2xl p-1.5 overflow-hidden ${
              collapsed ? 'left-full ml-3 bottom-0' : 'bottom-full mb-2 left-0'
            }`}
          >
            {/* Header profile info */}
            <div className="p-3 border-b border-slate-100 dark:border-white/[0.06] mb-1">
              <p className="text-xs font-bold text-slate-900 dark:text-[#F2F4F8]">{user.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-[#9AA0AE] truncate">{user.email}</p>
              <p className="text-[10.5px] text-brand-orange mt-1 font-semibold">
                {user.roleTitle}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-0.5">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-[#F2F4F8] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-blue-500" />
                  )}
                  <span>Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Toggle</span>
              </button>

              {/* Language switcher */}
              <div>
                <button
                  onClick={() => setShowLangSubmenu(!showLangSubmenu)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-[#F2F4F8] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-brand-orange" />
                    <span>Language</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                    {i18n.language}
                  </span>
                </button>

                {showLangSubmenu && (
                  <div className="my-1 pl-4 space-y-0.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl p-1.5 border border-slate-100 dark:border-white/[0.06]">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLangSelect(lang.code)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                          i18n.language === lang.code
                            ? 'font-bold text-brand-orange bg-white dark:bg-white/10 shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <span>{lang.native}</span>
                        <span className="text-[10px] text-slate-400">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Role Switcher */}
              <div>
                <button
                  onClick={() => setShowRoleSubmenu(!showRoleSubmenu)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-[#F2F4F8] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-brand-orange" />
                    <span>Switch Role (Demo)</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      showRoleSubmenu ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showRoleSubmenu && (
                  <div className="my-1 pl-4 space-y-0.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl p-1.5 border border-slate-100 dark:border-white/[0.06]">
                    {(['admin', 'manager', 'staff', 'viewer'] as Role[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRoleSelect(r)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg capitalize transition-colors ${
                          user.role === r
                            ? 'font-bold text-brand-orange bg-white dark:bg-white/10 shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {user.role === r && <UserCheck className="w-3.5 h-3.5 text-emerald-500" />}
                          {r}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {r === 'admin'
                            ? 'Full Access'
                            : r === 'manager'
                            ? 'Operations'
                            : r === 'staff'
                            ? 'Billing'
                            : 'Read-only'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-white/[0.06] my-1 pt-1" />

              {/* Logout */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('topbar.logout', 'Sign Out')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
