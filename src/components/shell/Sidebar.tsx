import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Package,
  ShieldAlert,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { UserMenu } from './UserMenu';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { Role } from '../../types/auth';
import { useTranslation } from 'react-i18next';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles?: Role[];
  badge?: string | number;
  badgeColor?: string;
  subItems?: { label: string; path: string }[];
}

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: t('nav.dashboard', 'Dashboard'),
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" strokeWidth={1.5} />,
    },
    {
      id: 'materials',
      label: t('nav.materials', 'Materials'),
      path: '/materials',
      icon: <Layers className="w-5 h-5" strokeWidth={1.5} />,
    },
    {
      id: 'items',
      label: t('nav.items', 'Items'),
      path: '/items',
      icon: <Package className="w-5 h-5" strokeWidth={1.5} />,
      badge: '3.4k',
    },
    {
      id: 'audit-log',
      label: t('nav.audit_log', 'Audit Log'),
      path: '/audit-log',
      icon: <ShieldAlert className="w-5 h-5" strokeWidth={1.5} />,
      allowedRoles: ['admin'],
    },
    {
      id: 'users-roles',
      label: t('nav.users_roles', 'Users & Roles'),
      path: '/users-roles',
      icon: <UserCog className="w-5 h-5" strokeWidth={1.5} />,
      allowedRoles: ['admin'],
    },
  ];

  const currentRole = user?.role || 'viewer';
  const visibleNavItems = navItems.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(currentRole)
  );

  const renderContent = (isMobile = false) => {
    const isCollapsed = !isMobile && sidebarCollapsed;

    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#0B0D14] border-r border-slate-200/80 dark:border-white/[0.06] transition-all select-none">
        {/* Rail Top: Logo / Brand + Toggle Button */}
        <div className={`h-16 sm:h-[70px] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} border-b border-slate-200/80 dark:border-white/[0.06] flex-shrink-0`}>
          {!isCollapsed ? (
            <>
              <NavLink to="/dashboard" onClick={() => isMobile && setMobileSidebarOpen(false)}>
                <Logo size="md" collapsed={false} />
              </NavLink>
              {isMobile ? (
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              ) : (
                <button
                  onClick={toggleSidebar}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2.5 py-4' : 'px-3 py-4'} space-y-1.5`}>
          {visibleNavItems.map((item) => {
            const hasSub = item.subItems && item.subItems.length > 0;
            const isSubActive =
              hasSub &&
              item.subItems?.some((sub) => location.pathname.startsWith(sub.path));
            const isActive = location.pathname === item.path || isSubActive;
            const isSubOpen = openSubmenus[item.id] ?? false;

            if (hasSub && !isCollapsed) {
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => toggleSubmenu(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-orange/15 to-transparent text-brand-orange border border-brand-orange/40 shadow-sm'
                        : 'text-slate-600 dark:text-[#9AA0AE] hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-brand-orange' : 'text-slate-400 dark:text-[#9AA0AE]'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        isSubOpen ? 'rotate-180' : ''
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>

                  {isSubOpen && (
                    <div className="pl-9 pr-1 py-1 space-y-1 border-l border-slate-200 dark:border-white/[0.08] ml-4">
                      {item.subItems!.map((sub) => {
                        const isCurrent = location.pathname.startsWith(sub.path);
                        return (
                          <NavLink
                            key={sub.path}
                            to={sub.path}
                            onClick={() => isMobile && setMobileSidebarOpen(false)}
                            className={`block px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                              isCurrent
                                ? 'font-bold text-brand-orange bg-brand-orange/10'
                                : 'text-slate-500 dark:text-[#9AA0AE] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                            }`}
                          >
                            {sub.label}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => isMobile && setMobileSidebarOpen(false)}
                className={({ isActive: exactActive }) => {
                  const active = exactActive || isActive;
                  return `flex items-center ${
                    isCollapsed ? 'justify-center w-11 h-11 mx-auto' : 'justify-between px-3 py-2.5'
                  } rounded-xl text-xs font-semibold transition-all group ${
                    active
                      ? 'bg-gradient-to-r from-brand-orange/20 to-brand-orange/5 text-brand-orange border border-brand-orange/50 shadow-[0_0_15px_rgba(255,107,53,0.25)]'
                      : 'text-slate-600 dark:text-[#9AA0AE] hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-[#F2F4F8]'
                  }`;
                }}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} min-w-0`}>
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Rail Bottom: Settings Cog + User Avatar Tile */}
        <div className={`p-3 border-t border-slate-200/80 dark:border-white/[0.06] flex-shrink-0 space-y-2 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {/* Settings Nav Item */}
          <NavLink
            to="/settings"
            onClick={() => isMobile && setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center ${
                isCollapsed ? 'justify-center w-11 h-11' : 'gap-3 px-3 py-2'
              } rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/40'
                  : 'text-slate-500 dark:text-[#9AA0AE] hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
              }`
            }
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings className="w-5 h-5" strokeWidth={1.5} />
            {!isCollapsed && <span>Settings</span>}
          </NavLink>

          {/* User Avatar tile & Profile Menu */}
          <UserMenu collapsed={isCollapsed} />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Persistent Left Icon Rail */}
      <aside
        className={`hidden md:block flex-shrink-0 transition-all duration-200 z-20 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">{renderContent(false)}</div>
      </aside>

      {/* Mobile Slide-Out Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-[#05060A]/80 backdrop-blur-sm"
          />
          {/* Drawer Box */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
