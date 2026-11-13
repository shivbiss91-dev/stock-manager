import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { GlobalSearchModal } from './GlobalSearchModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { AutoLogoutWarningModal } from './AutoLogoutWarningModal';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { TexturePatternsDefs } from '../common/TexturePatterns';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { StorageService } from '../../services/storageService';
import { Sparkles, RotateCcw, LogOut } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { initTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const handleResetDemo = () => {
    if (window.confirm('Reset all demo inventory, invoices, and orders back to initial sample state? This will only affect demo data.')) {
      StorageService.resetDemoWorkspace();
      window.location.reload();
    }
  };

  const handleExitDemo = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] dark:bg-[#05060A] text-slate-800 dark:text-[#F2F4F8] transition-colors p-0 sm:p-2.5 md:p-4 lg:p-5 flex flex-col justify-start items-center">
      {/* Global SVG Pattern Defs for Texture-rich Cards */}
      <TexturePatternsDefs />

      {/* Top Visible DEMO MODE Indicator Banner */}
      {user?.isDemo && (
        <div className="w-full max-w-[1720px] mb-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-[#FF6B35] to-amber-500 text-slate-950 flex flex-wrap items-center justify-between gap-3 shadow-md border border-amber-600/30 z-50 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-400 font-extrabold uppercase tracking-wider text-[10.5px] shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-400" />
              DEMO MODE
            </span>
            <span className="text-xs font-semibold text-slate-950">
              <strong>Sweedal – Demo Admin Workspace</strong> • Operating on isolated demo storage. Real production business records are protected.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDemo}
              className="px-3 py-1 rounded-lg bg-slate-950/15 hover:bg-slate-950/25 text-slate-950 font-extrabold transition-all flex items-center gap-1.5 text-xs cursor-pointer active:scale-95"
              title="Reset demo workspace back to pristine sample data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>

            <button
              type="button"
              onClick={handleExitDemo}
              className="px-3 py-1 rounded-lg bg-slate-950 text-white hover:bg-slate-900 font-extrabold transition-all flex items-center gap-1.5 text-xs shadow-sm cursor-pointer active:scale-95"
              title="Exit demo session and return to login"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Demo</span>
            </button>
          </div>
        </div>
      )}

      {/* Main App Container Panel: #0B0D14, 24px radius, 1px border, large shadow */}
      <div className="w-full max-w-[1720px] min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-2.5rem)] bg-white dark:bg-[#0B0D14] rounded-none sm:rounded-[24px] border-0 sm:border border-slate-200/90 dark:border-white/[0.06] shadow-none sm:shadow-panel flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Icon Rail (Desktop persistent + Mobile drawer) */}
        <Sidebar />

        {/* Content Column */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen md:min-h-0 bg-transparent">
          {/* Header */}
          <TopBar />

          {/* Page Viewport */}
          <main className="flex-1 p-3.5 sm:p-5 lg:p-6 w-full mx-auto overflow-y-auto">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>

      {/* Global Modals & Overlays */}
      <GlobalSearchModal />
      <KeyboardShortcutsModal />
      <AutoLogoutWarningModal />
    </div>
  );
};
