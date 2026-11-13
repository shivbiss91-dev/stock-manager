import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  RotateCcw,
  Users,
  Settings,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { StorageService } from '../../services/storageService';
import { Role } from '../../types/auth';
import { changeAppLanguage, SUPPORTED_LANGUAGES } from '../../i18n';
import { useTranslation } from 'react-i18next';

interface UserMenuProps {
  collapsed?: boolean;
  placement?: 'topbar' | 'sidebar';
}

export const UserMenu: React.FC<UserMenuProps> = ({
  collapsed = false,
  placement = 'sidebar',
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, switchRole, hasModulePermission } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showRoleSubmenu, setShowRoleSubmenu] = useState(false);
  const [showLangSubmenu, setShowLangSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking or touching outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowRoleSubmenu(false);
        setShowLangSubmenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowRoleSubmenu(false);
        setShowLangSubmenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    setShowRoleSubmenu(false);
    setShowLangSubmenu(false);
    navigate(path);
  };

  const handleLogout = () => {
    setIsOpen(false);
    setShowRoleSubmenu(false);
    setShowLangSubmenu(false);
    logout();
    navigate('/login');
  };

  const handleResetDemoData = () => {
    setIsOpen(false);
    if (
      window.confirm(
        'Reset all demo inventory, invoices, and orders back to initial sample state? This will only affect demo data.'
      )
    ) {
      StorageService.resetDemoWorkspace();
      window.location.reload();
    }
  };

  const initial = (user.name || 'User').charAt(0).toUpperCase();

  // Determine dropdown positioning based on placement & collapsed state
  const dropdownPositionClass =
    placement === 'topbar'
      ? 'absolute right-0 top-full mt-2 w-72 sm:w-80'
      : collapsed
      ? 'absolute left-full ml-3 bottom-0 w-72 sm:w-80'
      : 'absolute bottom-full mb-2 left-0 w-full min-w-[260px]';

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Trigger Button */}
      {placement === 'topbar' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-xl bg-brand-orange text-white font-bold flex items-center justify-center text-xs shadow-sm ring-1 ring-white/20 hover:ring-white/40 hover:scale-105 active:scale-95 transition-all select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange"
          title={`${user.name} (${user.role}) - Account Menu`}
          aria-label="User account menu"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            initial
          )}
        </button>
      ) : collapsed ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-11 h-11 rounded-xl bg-brand-orange text-white font-bold flex items-center justify-center text-sm shadow-md ring-1 ring-white/20 hover:ring-white/40 hover:scale-105 active:scale-95 transition-all select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange group"
          title={`${user.name} (${user.role}) - Account Menu`}
          aria-label="User account menu"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            initial
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 dark:bg-[#1A1D26] hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors group text-left border border-slate-200/80 dark:border-white/[0.08] cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange"
          aria-label="User account menu"
          aria-expanded={isOpen}
          aria-haspopup="true"
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
                  {initial}
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
            initial={{ opacity: 0, y: placement === 'topbar' ? -6 : 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === 'topbar' ? -6 : 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`z-50 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-white/[0.08] shadow-2xl p-1.5 overflow-hidden ${dropdownPositionClass}`}
          >
            {/* Header profile info */}
            <div className="p-3 bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06] rounded-xl mb-1">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-orange text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    initial
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-[#F2F4F8] truncate">
                      {user.name}
                    </p>
                    {user.isDemo && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                        Demo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#9AA0AE] truncate mt-0.5">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${roleColors[user.role]}`}
                    >
                      {user.role === 'admin' ? '👑 Administrator' : '📦 Staff Member'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions List */}
            <div className="space-y-0.5 pt-1">
              {/* Quick Navigation: Staff Management (Admin only) */}
              {user.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleNavigate('/users')}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-[#F2F4F8] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-brand-orange" />
                    <span>Staff Management</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-colors" />
                </button>
              )}

              {/* Quick Navigation: Company & System Settings */}
              {(user.role === 'admin' || hasModulePermission('module_settings')) && (
                <button
                  type="button"
                  onClick={() => handleNavigate('/settings')}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-[#F2F4F8] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-blue-400" />
                    <span>Company Settings</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-colors" />
                </button>
              )}

              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-[#F2F4F8] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
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
                  type="button"
                  onClick={() => setShowLangSubmenu(!showLangSubmenu)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-[#F2F4F8] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>
                      Language:{' '}
                      {SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language)?.name || 'English'}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      showLangSubmenu ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showLangSubmenu && (
                  <div className="my-1 ml-4 pl-2 border-l border-slate-200 dark:border-white/[0.08] space-y-1">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        type="button"
                        key={lang.code}
                        onClick={() => handleLangSelect(lang.code)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                          i18n.language === lang.code
                            ? 'font-bold text-brand-orange bg-slate-100 dark:bg-white/10 shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <span>{lang.nativeName}</span>
                        <span className="text-[10px] text-slate-400">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Role switcher (ERP Testing - Admin and Staff only, no Manager) */}
              {user.role === 'admin' && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowRoleSubmenu(!showRoleSubmenu)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-[#F2F4F8] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-brand-orange" />
                      <span>
                        Switch Role (Test): <strong className="capitalize">{user.role}</strong>
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        showRoleSubmenu ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showRoleSubmenu && (
                    <div className="my-1 ml-4 pl-2 border-l border-slate-200 dark:border-white/[0.08] space-y-1">
                      {(['admin', 'staff'] as Role[]).map((r) => (
                        <button
                          type="button"
                          key={r}
                          onClick={() => handleRoleSelect(r)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg capitalize transition-colors cursor-pointer ${
                            user.role === r
                              ? 'font-bold text-brand-orange bg-slate-100 dark:bg-white/10 shadow-sm'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {user.role === r && <UserCheck className="w-3.5 h-3.5 text-emerald-500" />}
                            {r === 'admin' ? 'Admin' : 'Staff'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {r === 'admin' ? 'Full Access' : 'Role-based Access'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reset Demo Data (Visible strictly in Demo Mode) */}
              {user.isDemo && (
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                  title="Reset sample inventory and transactions"
                >
                  <RotateCcw className="w-4 h-4 text-amber-500" />
                  <span>Reset Demo Data</span>
                </button>
              )}

              <div className="border-t border-slate-100 dark:border-white/[0.06] my-1 pt-1" />

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{user.isDemo ? 'Exit Demo Session' : t('topbar.logout', 'Sign Out')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
